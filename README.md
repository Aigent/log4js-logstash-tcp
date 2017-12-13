log4js-logstashTCP
===============
[![Build Status](https://secure.travis-ci.org/gembly/log4js-logstash.png)](http://travis-ci.org/gembly/log4js-logstash)

This is a copy of the logstashUDP appender but instead sending via UDP send via TCP to avoid the maximum 64k bytes message size with the logstashUDP appender

Installation
------------
You can install install log4js-logstashTCP by adding this .git url to your package.json or do a npm install log4js-logstashTCP

Usage: logstash configuration
-----------------------------
In the "input" part of the logstash server conf :
    
    input {
    	tcp {
    		codec => "json"
    		port => 5050
    		type => "tcp-input"
    	}
    }


Usage: log4js configuration
---------------------------
Plain javascript
```javascript
    var log4js = require('log4js');
    log4js.configure({
        "appenders": [
            {
                "category": "TEST",
                "type": "log4js-logstashTCP",
                "host": "localhost",
                "port": 5050,
                "fields": {
                    "instance": "MyAwsInstance",
                    "source": "myApp",
                    "environment": "development"
                }
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


