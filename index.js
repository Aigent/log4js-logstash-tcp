'use strict';

const net = require('net');
const util = require('util');

function sendLog(host, port, logObject) {
    const msg = JSON.stringify(logObject) + "\n";
    const tcp = net.connect({host: host, port: port}, function () {
        tcp.write(msg);
        tcp.end();
        tcp.close();
    });

    tcp.on('error', function (evt) {
        console.error('An error happened while sending log line to logstash', evt);
    });
}


function logstashTCP(config, layout) {
    const type = config.logType ? config.logType : config.category;

    if (!config.fields) {
        config.fields = {};
    }

    function checkArgs(argsValue, logUnderFields) {
        if ((!argsValue) || (argsValue === 'both')) {
            return true;
        }

        if (logUnderFields && (argsValue === 'fields')) {
            return true;
        }

        if ((!logUnderFields) && (argsValue === 'direct')) {
            return true;
        }

        return false;
    }

    function log(loggingEvent) {
        /*
         https://gist.github.com/jordansissel/2996677
         {
         'message'    => 'hello world',
         '@version'   => '1',
         '@timestamp' => '2014-04-22T23:03:14.111Z',
         'type'       => 'stdin',
         'host'       => 'hello.local'
         }
         @timestamp is the ISO8601 high-precision timestamp for the event.
         @version is the version number of this json schema
         Every other field is valid and fine.
         */

        const fields = {};
        Object.keys(config.fields).forEach((key) => {
            fields[key] = typeof config.fields[key] === 'function' ? config.fields[key](loggingEvent) : config.fields[key];
        });

        /* eslint no-prototype-builtins:1,no-restricted-syntax:[1, "ForInStatement"] */
        if (loggingEvent.data.length > 1) {
            const secondEvData = loggingEvent.data[1];
            if ((secondEvData !== undefined) && (secondEvData !== null)) {
                Object.keys(secondEvData).forEach((key) => {
                    fields[key] = secondEvData[key];
                })
                ;
            }
        }
        fields.level = loggingEvent.level.levelStr;
        fields.category = loggingEvent.categoryName;

        const logObject = {
            '@version': '1',
            '@timestamp': (new Date(loggingEvent.startTime)).toISOString(),
            type: type,
            message: layout(loggingEvent)
        };

        if (checkArgs(config.args, true)) {
            logObject.fields = fields;
        }

        if (checkArgs(config.args, false)) {
            Object.keys(fields).forEach((key) => {
                logObject[key] = fields[key];
            });
        }

        sendLog(config.host, config.port, logObject);
    }

    log.shutdown = function (cb) {
        cb();
    };

    return log;
}

function configure(config, layouts) {
    let layout = layouts.dummyLayout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }

    return logstashTCP(config, layout);
}

module.exports.configure = configure;
