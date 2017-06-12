/**
 *
 * hpcontrol adapter
 *
 *
 *  file io-package.json comments:
 *
 *  {
 *      "common": {
 *          "name":         "hpcontrol",                  // name has to be set and has to be equal to adapters folder name and main file name excluding extension
 *          "version":      "0.0.0",                    // use "Semantic Versioning"! see http://semver.org/
 *          "title":        "Node.js hpcontrol Adapter",  // Adapter title shown in User Interfaces
 *          "authors":  [                               // Array of authord
 *              "name <mail@hpcontrol.com>"
 *          ]
 *          "desc":         "hpcontrol adapter",          // Adapter description shown in User Interfaces. Can be a language object {de:"...",ru:"..."} or a string
 *          "platform":     "Javascript/Node.js",       // possible values "javascript", "javascript/Node.js" - more coming
 *          "mode":         "daemon",                   // possible values "daemon", "schedule", "subscribe"
 *          "schedule":     "0 0 * * *"                 // cron-style schedule. Only needed if mode=schedule
 *          "loglevel":     "info"                      // Adapters Log Level
 *      },
 *      "native": {                                     // the native object is available via adapter.config in your adapters code - use it for configuration
 *          "test1": true,
 *          "test2": 42
 *      }
 *  }
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

// you have to require the utils module and call adapter function
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.hpcontrol.0
var adapter = utils.adapter('hpcontrol');
var net = require('net');

var interval;

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        clearInterval(interval);
        adapter.log.info('cleaned everything up...');
    } catch (e) {

    }
    callback();
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    //adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    //adapter.log.info('YYYYY stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        adapter.log.info('ack is not set!');
    }
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    if (typeof obj == 'object' && obj.message) {
        if (obj.command == 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    main();
});

function setupObjects() {
    adapter.setObjectNotExists('values', {
        type: 'channel',
        common: {
            name: 'values'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.workingState', {
        type: 'state',
        common: {
            name: 'workingState',
            type: 'bolean',
            role: 'state'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.10_returnTemperature', {
        type: 'state',
        common: {
            name: '10_returnTemperature',
            type: 'number',
            role: 'value.temperature',
            unit: '°C'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.11_underfloorHeatingTemperature', {
        type: 'state',
        common: {
            name: '11_underfloorHeatingTemperature',
            type: 'number',
            role: 'value.temperature',
            unit: '°C'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.15_ambientTemperature', {
        type: 'state',
        common: {
            name: '15_ambientTemperature',
            type: 'number',
            role: 'value.temperature',
            unit: '°C'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.16_averageAmbientTemperature', {
        type: 'state',
        common: {
            name: '16_averageAmbientTemperature',
            type: 'number',
            role: 'value.temperature',
            unit: '°C'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.17_actualHotWaterTemperature', {
        type: 'state',
        common: {
            name: '17_actualHotWaterTemperature',
            type: 'number',
            role: 'value.temperature',
            unit: '°C'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.18_setHotWaterTemperature', {
        type: 'state',
        common: {
            name: '18_setHotWaterTemperature',
            type: 'number',
            role: 'value.temperature',
            unit: '°C'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.56_counterWorkingPeriodVD1', {
        type: 'state',
        common: {
            name: '56_counterWorkingPeriodVD1',
            type: 'number',
            role: 'value',
            unit: 'h'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.57_counterWorkingImpuls', {
        type: 'state',
        common: {
            name: '57_counterWorkingImpuls',
            type: 'number',
            role: 'value'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.64_workingPeriodHeating', {
        type: 'state',
        common: {
            name: '64_workingPeriodHeating',
            type: 'number',
            role: 'value',
            unit: 'h'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.65_workingPeriodHotWater', {
        type: 'state',
        common: {
            name: '65_workingPeriodHotWater',
            type: 'number',
            role: 'value',
            unit: 'h'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.151_counterHeatQuantityHeating', {
        type: 'state',
        common: {
            name: '151_counterHeatQuantityHeating',
            type: 'number',
            role: 'value',
            unit: 'kWh'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.152_counterHeatQuantityHotWater', {
        type: 'state',
        common: {
            name: '152_counterHeatQuantityHotWater',
            type: 'number',
            role: 'value',
            unit: 'kWh'
        },
        native: {}
    });

    adapter.setObjectNotExists('values.155_rateOfFlow', {
        type: 'state',
        common: {
            name: '155_rateOfFlow',
            type: 'number',
            role: 'value',
            unit: 'l/h'
        },
        native: {}
    });
}

function setValue(index, value) {
    switch(index) {
        case -2:
            var state = value>0?true:false;
            adapter.setState('values.workingState', {val: state, ack: true});
            break;
        case 10:
            adapter.setState('values.10_returnTemperature', {val: value/10, ack: true});
            break;
        case 11:
            adapter.setState('values.11_underfloorHeatingTemperature', {val: value/10, ack: true});
            break;
        case 15:
            adapter.setState('values.15_ambientTemperature', {val: value/10, ack: true});
            break;
        case 16:
            adapter.setState('values.16_averageAmbientTemperature', {val: value/10, ack: true});
            break;
        case 17:
            adapter.setState('values.17_actualHotWaterTemperature', {val: value/10, ack: true});
            break;
        case 18:
            adapter.setState('values.18_setHotWaterTemperature', {val: value/10, ack: true});
            break;
        case 56:
            adapter.setState('values.56_counterWorkingPeriodVD1', {val: value, ack: true});
            break;
        case 57:
            adapter.setState('values.57_counterWorkingImpuls', {val: value, ack: true});
            break;
        case 64:
            adapter.setState('values.64_workingPeriodHeating', {val: value, ack: true});
            break;
        case 65:
            adapter.setState('values.65_workingPeriodHotWater', {val: value, ack: true});
            break;
        case 151:
            adapter.setState('values.151_counterHeatQuantityHeating', {val: value, ack: true});
            break;
        case 152:
            adapter.setState('values.152_counterHeatQuantityHotWater', {val: value, ack: true});
            break;
        case 155:
            adapter.setState('values.155_rateOfFLow', {val: value, ack: true});
            break;
    }

}

function loadValues() {
    var client = new net.Socket();
    client.connect(8888, "192.168.1.133", function () {
        var buf = Buffer.from([0,0, 11, 188]);
        client.write(buf);
        buf = Buffer.from([0, 0, 0, 0]);
        client.write(buf);
    });

    client.on('data', function (data) {
        var laenge = data.length;
        for (var i = 0; i < laenge ; i+=4) {
            var result = 0;
            result = ((data[i+3]) |
            (data[i + 2] << 8) |
            (data[i + 1] << 16) |
            (data[i] << 24));

//            console.log("I: " + (i/4-3) + " Wert: " + result);
            setValue(i/4-3, result);
        }
    });
}

function main() {
    adapter.log.info('LAEUFT');

    setupObjects();

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    adapter.log.info('config hpip: ' + adapter.config.hpip);
    adapter.log.info('config hpport: ' + adapter.config.hpport);


    // in this hpcontrol all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');

    adapter.log.info('INTERVAL GESETZT');
    interval = setInterval(function () {
        //adapter.log.info('INTERVAL');
        //adapter.setState('values.ambientTemperature', '17.6');
        loadValues();
    }, 120000);



    /**
     *   setState examples
     *
     *   you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
     *
     */
    /*
    // the variable testVariable is set to true as command (ack=false)
    adapter.setState('testVariable', true);
    adapter.setState('values.ambientTemperature', '17.6');
    // same thing, but the value is flagged "ack"
    // ack should be always set to true if the value is received from or acknowledged from the target system
    adapter.setState('testVariable', {val: true, ack: true});

    // same thing, but the state is deleted after 30s (getState will return null afterwards)
    adapter.setState('testVariable', {val: true, ack: true, expire: 30});
    */
}
