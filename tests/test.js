var net = require('net'),
    log4jsAppender = require('../index');

module.exports = {
    setUp: function (callback) {
        "use strict";
        var self = this;
        this.config = {
            "category": "TEST",
            "type": "log4js-logstash",
            "host": "localhost",
            "port": 5959,
            "fields": {
                "instance": "MyAwsInstance",
                "source": "myApp",
                "environment": "development"
            }
        };

        this.testServer = net.createServer();
        this.testServer.on('listening', function () {
            callback();
        });
        this.testServer.listen(this.config.port, this.config.host);
    },
    tearDown: function (callback) {
        "use strict";
        var self = this;
        this.testServer.on('close', function () {
            callback();
        });
        this.testServer.close();
    },
    'Check basic usage': function (test) {
        "use strict";
        test.expect(2);
        var self = this,
            message = 'Im awesome',
            log;

        test.doesNotThrow(function () {
            log = log4jsAppender.configure(self.config);
        }, 'Error', 'Configure shouldn\'t throw an error');

        this.testServer.on('connection', function (con) {
            con.on('data', function (data) {
                test.strictEqual(JSON.parse(data.toString())['@message'], message, 'data should be message!');
                test.done();
            });
        });
        log({ level: {levelStr: 'FOO'}, categoryName: 'BAR', data: [message] });
    }
};
