const net = require('net');
const log4jsAppender = require('../index.js');
const layouts = require('log4js/lib/layouts.js');

const context = {};
beforeEach(() => {
    return new Promise((resolve) => {
        context.config = {
            "category": "TEST",
            "type": "log4js-logstashTCP",
            "host": "localhost",
            "port": 5050,
            "fields": {
                "instance": "MyAwsInstance",
                "source": "myApp",
                "environment": "development"
            }
        };

        context.testServer = net.createServer({
        });
        context.testServer.on('listening', function () {
            resolve();
        });
        context.testServer.listen(context.config.port, context.config.host);
    })
})
afterEach(() => {
    return new Promise((resolve) => {
        context.testServer.close();
        context.testServer.on('close', function () {
            delete context.testServer;
            resolve();
        });
        // context.testServer.forceClose();
    })
})
describe('check basic usage', () => {
    "use strict";

    it('testing logger setup, configuration and sending log message', (done) => {
        const message = 'Im awesome';
        let log = null;

        try {
            log = log4jsAppender.configure(context.config, layouts);
        } catch (e) {
            return fail('configure shouldn\'t throw an error');
        }

        context.testServer.on('connection', function (con) {
            con.on('data', function (data) {
                expect(JSON.parse(data.toString())['message']).toBe(message);
                log.shutdown(() => {
                    done();
                })
            });
        });
        log({startTime: new Date(), level: {levelStr: 'FOO'}, categoryName: 'BAR', data: [message]});
    })

    it('testing logger setup, configuration and sending log message with context', (done) => {
        const message = 'Im awesome';
        let log = null;

        try {
            log = log4jsAppender.configure(context.config, layouts);
        } catch (e) {
            return fail('configure shouldn\'t throw an error');
        }

        context.testServer.on('connection', function (con) {
            con.on('data', function (data) {
                const parsedData = JSON.parse(data.toString())
                expect(parsedData['message']).toBe(message);
                expect(parsedData['testContextField']).toBe('test context field value')
                log.shutdown(() => {
                    done();
                })
            });
        });
        log({
            startTime: new Date(),
            level: {levelStr: 'FOO'},
            categoryName: 'BAR',
            data: [message],
            context: {
                testContextField: "test context field value"
            }});
    })
    it('testing logger setup, configuration and sending log message with context but gets overwritten by log message', (done) => {
        const message = 'Im awesome';
        let log = null;

        try {
            log = log4jsAppender.configure(context.config, layouts);
        } catch (e) {
            return fail('configure shouldn\'t throw an error');
        }

        context.testServer.on('connection', function (con) {
            con.on('data', function (data) {
                const parsedData = JSON.parse(data.toString());
                expect(parsedData['message']).toBe(message);
                expect(parsedData['testContextField']).toBe('context value overwritten');
                log.shutdown(() => {
                    done();
                })
            });
        });
        log({
            startTime: new Date(),
            level: {levelStr: 'FOO'},
            categoryName: 'BAR',
            data: [message, {testContextField: "context value overwritten"}],
            context: {
                testContextField: "test context field value"
        }});
    })
})
