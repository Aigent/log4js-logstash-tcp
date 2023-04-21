'use strict';

const TcpConnectionPool = require("./classes/TcpConnectionPool").TcpConnectionPool;

const tcpConnectionPool = new TcpConnectionPool();

let apm = false;
try {
    apm = require('elastic-apm-node');
} catch(e) {
    // ignore APM if it's not loaded
}


function sendLog(host, port, logObject) {
    tcpConnectionPool.send(host, port, logObject);
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

        return (!logUnderFields) && (argsValue === 'direct');
    }

    function log(loggingEvent) {
        let currentAPMTransaction = false
        if(apm && apm.currentTransaction) {
            currentAPMTransaction = apm.currentTransaction
        }

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
        // adding context to log messages as separate fields added by logger.addContext(key, value)
        if(loggingEvent.context) {
            if(loggingEvent.data.length === 1 || !loggingEvent.data[1]) {
                loggingEvent.data[1] = {}
            }
            if(typeof loggingEvent.data[1] === 'object') {
                loggingEvent.data[1] = {
                    ...loggingEvent.context,
                    ...loggingEvent.data[1]
                }
            }
        }

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
            // this allows to show logs generated by logging events together with APM events
            ...(currentAPMTransaction.ids || {}),
            type: type,
            message: layout(loggingEvent)//.data[0]
        };

        if (checkArgs(config.args, false)) {
            Object.keys(fields).forEach((key) => {
                logObject[key] = fields[key];
            });
        }
        sendLog(config.host, config.port, logObject);
    }

    log.shutdown = function (cb) {
        tcpConnectionPool.close(cb);
    };

    return log;
}

function configure(config, layouts) {
    let layout = layouts.dummyLayout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }
    if(!layout) {
        throw new Error('wrong and/or unknown layout chosen in log4js configuration', config.layout);
    }
    return logstashTCP(config, layout);
}

module.exports.configure = configure;
