/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var argv = require('optimist')
    .usage('Usage: $0 --ipaddress [Z-Wave device IPv4 or IPv6 address] --psk [PSK password] --deviceclass [Device class code]')
    .default({'ipAddress': null, 'deviceClass': null})
    .demand(['psk'])
    .argv;

// register success and error callbacks for testing purposes (these are normally populated by the runtime)    
function onSuccess(ipAddress, pskPassword, message) {
    console.log("  ipAddress    : " + ipAddress);
    console.log("  pskPassword  : " + pskPassword);
    console.log("  message      : " + message);

    process.exit();
}

function onError(type, message) {
    console.log('Error (' + type + '): ' + message);
    process.exit();
}

// Call onboarding to find available devices
require('../index').onboard(argv.ipaddress, argv.psk, argv.deviceclass, onSuccess, onError);
