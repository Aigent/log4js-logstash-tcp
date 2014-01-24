"use strict";
var net = require('net');

var port = 9200,
    host = 'localhost',
    fields = {},
    batch = 200,
    timeout = 10,
    time = process.hrtime(),
    messages = [],
    timeOutId = 0;

function logStashAppender () {
    //Setup the connection to logstash
    function pushToStash(server, port, msg) {
        var client = net.connect({host: server, port: port}, function () {
            client.write(msg);
            client.end();
        });
        //Fail silently
        client.on('error', function (evt) {console.log(evt);});
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
        messages.push(JSON.stringify(data));
        clearTimeout(timeOutId);
        if((process.hrtime(time)[0] >= 10 || messages.length > batch)) {
            pushToStash(host, port, messages.join('\n'));
            time = process.hrtime();
            messages = [];
        } else {
            timeOutId = setTimeout(function () {
                pushToStash(host, port, messages.join('\n'));
                time = process.hrtime();
                messages = [];
            }, 1000);
        }
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
