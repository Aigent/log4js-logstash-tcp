"use strict";

var net = require('net');

var port = 9200,
    host = 'localhost',
    instance = 'myAWSinstance',
    source = 'myApp',
    environment = 'dev';

function logStashAppender () {
    //Setup the connection to logstash
    function pushToStash(server, port, msg) {
        var client = net.connect({host: server, port: port}, function () {
            client.write(msg);
            client.end();
        });
    }

    return function (loggingEvent) {
        //do stuff with the logging event
        var data = {};
        data['@timestamp'] = (new Date()).toISOString();
        data['@fields'] = {
            instance: instance,
            level: loggingEvent.level.levelStr,
            source: source,
            environment: environment,
            category: loggingEvent.categoryName
        };
        data['@message'] = loggingEvent.data[0];
        pushToStash(host, port, JSON.stringify(data));
    };
}

function configure(config) {
    port = (config.port !== undefined) ? config.port : port;
    host = (config.host !== undefined) ? config.host : host;
    instance = (config.instance !== undefined) ? config.instance : instance;
    source = (config.source !== undefined) ? config.source : source;
    environment = (config.environment !== undefined) ? config.environment : environment
    ;
    return logStashAppender();
}

exports.appender = logStashAppender;
exports.configure = configure;
