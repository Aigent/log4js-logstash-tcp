log4js-logstash-tcp
===============
[![Build Status](https://app.travis-ci.com/Degola/log4js-logstash-tcp.svg?branch=master)](https://app.travis-ci.com/Degola/log4js-logstash-tcp)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FAigent%2Flog4js-logstash-tcp.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FAigent%2Flog4js-logstash-tcp?ref=badge_shield)

This is a copy of the logstashUDP appender but instead sending via UDP send via TCP to avoid the maximum 64k bytes message size with the logstashUDP appender

Installation
------------
You can install log4js-logstash-tcp by adding this .git url to your package.json or do a `npm install log4js-logstash-tcp`

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
                "category": "tests",
                "type": "log4js-logstash-tcp",
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
    // adding context and add it as additional field to each log entry
    log.addContext('customer', {id: 123, name: 'John Doe'});

    log.error('hello hello');
```




## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FAigent%2Flog4js-logstash-tcp.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FAigent%2Flog4js-logstash-tcp?ref=badge_large)
