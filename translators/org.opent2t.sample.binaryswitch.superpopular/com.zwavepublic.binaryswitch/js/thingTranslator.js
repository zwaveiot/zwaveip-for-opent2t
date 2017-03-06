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

// zwaveip
let ZWaveIP = require('zwaveip');

let zwaveDeviceConnection = null;

module.exports.initDevice = function(device) {
    if (typeof device === "undefined") {
        console.log("device is undefined.");
        throw TypeError();
    }
    if (typeof device.props === "undefined") {
        console.log("device.props is undefined.");
        throw TypeError();
    }

    // parse the properties
    let props;
    try {
        props = JSON.parse(device.props);
    } catch (ex) {
        console.log("device.props are invalid.");
        throw TypeError();
    }

    let ipAddress = props.ipAddress;
    // NOTE: client identity is a fixed-string in this release
    let pskIdentity = "Client_identity";
    // convert the hex-encoded PSK to a binary buffer
    let pskPassword = parsePskPasswordFromHex(props.pskPassword);

    console.log("Initialized device: " + ipAddress);
    this.zwaveDeviceConnection = ZWaveIP.connectToZWaveDevice(ipAddress, pskIdentity, pskPassword);
    // call .unref() so that the UDP/DTLS socket reference does not delay node.js from closing
    this.zwaveDeviceConnection.unref();
}

module.exports.disconnect = function() {
    /* disconnect device */
    try {
        this.zwaveDeviceConnection.close();
    }
    catch (ex) {
        /* we can safely ignore any exceptions disconnecting from device */
    }
}

module.exports.getPowerState = function() {
    console.log("Querying binary switch state: " + this.zwaveDeviceConnection.ipAddress);
    this.zwaveDeviceConnection.sendMessageAndWaitForResponse(ZWaveIP.CommandClass.SwitchBinary, ZWaveIP.SwitchBinaryCommand.Get, [], ZWaveIP.SwitchBinaryCommand.Report)
    .then(
        function(response) { 
            // fulfillment
            if (typeof response !== "undefined" && typeof response.data !== "undefined" && response.data.length >= 1) {
                let powerStateAsByte = response.data[0];
                let powerStateAsBoolean = (powerStateAsByte != 0);
                console.log("powerState: " + powerStateAsBoolean + " (" + powerStateAsByte + ")");
                return powerStateAsBoolean;
            }
        },
        function(err) {
            // failure
            console.log("ERROR: could not retrieve power state.");
        }
    );
}

module.exports.turnOn = function() {
    console.log("Turning on device: " + this.zwaveDeviceConnection.ipAddress);
    this.zwaveDeviceConnection.sendMessage(ZWaveIP.CommandClass.SwitchBinary, ZWaveIP.SwitchBinaryCommand.Set, [0xFF])
    .then(
        function() { 
            // fulfillment
            console.log("'On' message sent.");
        },
        function(err) {
            // failure
            console.log("ERROR: could not turn on device");
        }
    );
}

module.exports.turnOff = function() {
    console.log("Turning off device: " + this.zwaveDeviceConnection.ipAddress);
    this.zwaveDeviceConnection.sendMessage(ZWaveIP.CommandClass.SwitchBinary, ZWaveIP.SwitchBinaryCommand.Set, [0x00])
    .then(
        function() { 
            // fulfillment
            console.log("'Off' message sent.");
        },
        function(err) {
            // failure
            console.log("ERROR: could not turn off device");
        }
    );
}

function parsePskPasswordFromHex(pskPassword) {
    let result = Buffer.alloc(pskPassword.length / 2);

    for (let i = 0; i < pskPassword.length; i += 2) {
        result[i / 2] = parseInt("0x" + pskPassword.substr(i, 2), 16);
    }

    return result;
}