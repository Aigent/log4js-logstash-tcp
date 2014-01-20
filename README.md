log4js-logstash
===============

This is a very simple log4js appender that can talk to logstash instances. This version is still very specific to Gembly Games B.V. but feel free to fork and adjust =)

Installation
------------

You can install install log4js-logstash by adding this .git url to your package.json

Usage: log4js configuration
---------------------------
```javascript
    var log4js = require('log4js');
    log4js.configure({
        "appenders": [
            {
                "category": "TEST",
                "type": "log4js-logstash",
                "host": "localhost",
                "port": 5959,
                "instance": "MyAwsInstance",
                "source": "myApp",
                "environment": "development"
            },
            {
                "category": "tests",
                "type": "console"
            }
        ],
        "levels": {
            "tests":  "DEBUG"
        }
    });

    var log = log4js.getLogger('tests');

    log.error('hello hello');
```

