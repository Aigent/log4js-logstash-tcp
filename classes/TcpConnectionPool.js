"use strict";

const net = require("net");
const EventEmitter = require('events');

const MAX_TCP_CONNECITONS = 300;

class TcpConnectionWrapper extends EventEmitter {

    constructor(host, port) {
        super();

        const self = this;
        this.connection = net.connect({
            host: host,
            port: port
        }, function() {
            self.connected = true;
        });

        this.connection.setTimeout(5000);
        this.connection.on("timeout", () => {self.destroy()});
        this.connection.on("close", () => {self.destroy()});
        this.connection.on("error", (err) => {
            console.error(`Error with the connection to ${host}:${port}. ${err}`);
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

        this.connection.write(message)
    }

    destroy() {
        this.connection.end();
        this.connection.destroy();

        this.emit("destroy");
    }

}

class TcpConnectionPool {

    constructor() {
        this.tcpConnections = {}

    }

    send(host, port, logObject) {
        this._getTcpConnection(host, port).send(logObject);
    }

    _getTcpConnection(host, port) {
        const index = TcpConnectionPool._createIndexForTcpConnection();
        return this.tcpConnections[index] || this._createTcpConnection(index, host, port);
    }

    _createTcpConnection(index, host, port) {
        const self = this;
        const tcpConnectionWrapper = new TcpConnectionWrapper(host, port);
        this.tcpConnections[index] = tcpConnectionWrapper;

        tcpConnectionWrapper.on("destroy", () => {
            delete self.tcpConnections[index];
        });

        return tcpConnectionWrapper;
    }

    static _createIndexForTcpConnection() {
        return Math.floor( Math.random() * MAX_TCP_CONNECITONS) % MAX_TCP_CONNECITONS;
    }

}

module.exports.TcpConnectionPool = TcpConnectionPool;

