// NOTE: this is a temporary test suite, derived from an existing OpenT2T test suite

var translator = require('../thingTranslator.js');

var argv = require('optimist')
    .usage('Usage: --ipaddress [Z-Wave device IPv4 or IPv6 address] --psk [PSK password]')
    .demand(['ipaddress', 'psk'])
    .argv;

// device object used for testing purposes (this is normally populated by the runtime)      
function ZWaveDevice(ipAddress, pskPassword) {
    this.props = '{"ipAddress": "' + ipAddress + '", "pskPassword": "' + pskPassword + '"}';
    this.name = "Z-Wave Binary Switch (Test)";
}

let zwaveDevice = new ZWaveDevice(argv.ipaddress, argv.psk);

// initialize the translator for testing purposes (this is normally called by the runtime)
translator.initDevice(zwaveDevice);

// Go through a sequence of test operations for the translator
setTimeout(function() {
    translator.turnOn();
        setTimeout(function() {
        translator.turnOff();
        setTimeout(function() {
            translator.disconnect();
            setTimeout(function() {
                process.exit(0);
            }, 3000);
        }, 5000);
    }, 5000);
}, 7000);
