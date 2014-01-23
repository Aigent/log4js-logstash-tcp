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
        this.connection = null;
        this.testServer = net.createServer();
        this.testServer.listen(this.config.port, function () {
            callback();
        });
    },
    tearDown: function (callback) {
        "use strict";
        callback();
    },
    'Check basic usage': function (test) {
        "use strict";
        test.expect(2);
        var self = this,
            log,
            logEvent;

        test.doesNotThrow(function () {
            log = log4jsAppender.configure(self.config);
        }, 'Error', 'Configure shouldn\'t throw an error');

        var message = 'Im awesome';

        this.testServer.on('connection', function (con) {
            con.on('data', function (data) {
                test.strictEqual(JSON.parse(data.toString())['@message'], message, 'data should be message!');
                self.testServer.close();
                test.done();
            });
        });

        logEvent = { level: {levelStr: 'FOO'}, categoryName: 'BAR', data: [message] };
        log(logEvent);
    }
};
