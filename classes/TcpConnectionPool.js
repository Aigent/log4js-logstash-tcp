"use strict";

const net = require("net");
const EventEmitter = require('events');

const DEFAULT_MAX_TCP_CONNECTIONS = 300;

class TcpConnectionWrapper extends EventEmitter {

    constructor(host, port, config) {
        super();

        this.connectionNotReadyRetryInterval = parseInt(config.connectionNotReadyRetryInterval || 500);
        this.connectionTimeout = parseInt(config.connectionTimeout || 5000);

        const self = this;
        this.connection = net.connect({
            host: host,
            port: port
        }, function() {
            self.connected = true;
        });

        this.connection.setTimeout(this.connectionTimeout);
        this.connection.on("timeout", () => {self.destroy()});
        this.connection.on("close", () => {self.destroy()});
        this.connection.on("error", (err) => {
            console.error(`logstash Error with the connection to ${host}:${port}. ${err}`);
            // From docs: "The close event will be called just after this one
        });
    }

    send(logObject) {
        const message = ( (obj) => {
            if (typeof obj === "string") {
                return obj + "\n";
            } else {
                return JSON.stringify(obj) + "\n";
            }
        } )(logObject);

        this.realSend(message);
    }
    realSend(message) {
        const self = this;
        if(this.connected === true) {
            this.connection.write(message)
        } else {
            const timeout = setTimeout(() => {
                self.realSend(message);
                clearTimeout(timeout);
            }, this.connectionNotReadyRetryInterval);
        }

    }

    destroy(cb) {
        const self = this;
        this.connection.end(() => {
            self.connection.destroy();
            if (typeof cb === "function") {
                cb();
            }
        });

        this.emit("destroy");
    }

}

class TcpConnectionPool {

    constructor(config) {
        this.tcpConnections = {}
        if(config) this.config = config;
        else this.config = {};

        if(!this.config.maxTcpConnections) {
            this.config.maxTcpConnections = DEFAULT_MAX_TCP_CONNECTIONS;
        }

    }

    send(host, port, logObject) {
        this._getTcpConnection(host, port).send(logObject);
    }

    _getTcpConnection(host, port) {
        const index = this._createIndexForTcpConnection();
        return this.tcpConnections[index] || this._createTcpConnection(index, host, port);
    }

    _createTcpConnection(index, host, port) {
        const self = this;
        const tcpConnectionWrapper = new TcpConnectionWrapper(host, port, this.config);
        this.tcpConnections[index] = tcpConnectionWrapper;

        tcpConnectionWrapper.on("destroy", () => {
            delete self.tcpConnections[index];
        });

        return tcpConnectionWrapper;
    }

    _createIndexForTcpConnection() {
        return Math.floor( Math.random() * this.config.maxTcpConnections) % this.config.maxTcpConnections;
    }

    close(cb) {
        const connections = [];
        Object.keys(this.tcpConnections).forEach((index) => {
            connections.push(this.tcpConnections[index]);
        });

        let completed = 0;
        const complete = () => {
            if (++completed >= connections.length) {
                if (typeof cb === "function") {
                    cb();
                }
            }
        };
        for (const tcpConnectionWrapper of connections) {
            tcpConnectionWrapper.destroy(complete);
        }
    }
}

module.exports.TcpConnectionPool = TcpConnectionPool;

