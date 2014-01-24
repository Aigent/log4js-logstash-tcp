"use strict";
var net = require('net');

var port = 9200,
    host = 'localhost',
    fields = {};

function logStashAppender () {
    //Setup the connection to logstash
    function pushToStash(server, port, msg) {
        var client = net.connect({host: server, port: port}, function () {
            client.write(msg);
            client.end();
        });
        //Fail silently
        client.on('error', function () {});
    }

    return function (loggingEvent) {
        //do stuff with the logging event
        var data = {};
        data['@timestamp'] = (new Date()).toISOString();
        data['@fields'] = {
            level: loggingEvent.level.levelStr,
            category: loggingEvent.categoryName
        };
        for (var key in fields) {
            data['@fields'][key] = fields[key];
        }
        data['@message'] = loggingEvent.data[0];
        pushToStash(host, port, JSON.stringify(data));
    };
}

function configure(config) {
    port = (config.port !== undefined) ? config.port : port;
    host = (config.host !== undefined) ? config.host : host;

    if (config.fields && typeof config.fields === 'object') {
        for (var key in config.fields) {
            if(typeof config.fields[key] !== 'function') {
                fields[key] = config.fields[key];
            }
        }
    }
    return logStashAppender();
}

exports.appender = logStashAppender;
exports.configure = configure;
