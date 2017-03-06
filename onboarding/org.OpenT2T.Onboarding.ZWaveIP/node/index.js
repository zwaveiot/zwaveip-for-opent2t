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
// inquirer
let inquirer = require('inquirer');

// module exports, implementing the schema
module.exports = {
    onboard: function(gatewayIpAddress, pskPassword, deviceClassId, successCallback, errorCallback) {

        let parsePskPasswordFromHex = function(pskPassword) {
            let result = Buffer.alloc(pskPassword.length / 2);

            for (let i = 0; i < pskPassword.length; i += 2) {
                result[i / 2] = parseInt("0x" + pskPassword.substr(i, 2), 16);
            }

            return result;
        }

        // NOTE: client identity is a fixed-string in this release
        let pskIdentity = "Client_identity";

        // convert the pskPassword from a HEX value to a byte array
        let pskPasswordBuffer = parsePskPasswordFromHex(pskPassword);

        let searchForDevicesComplete = function(nodeList) {
            var deviceChoices = [];
            for (let index = 0; index < nodeList.length; index++) {
                if (typeof deviceClassId === 'undefined' || deviceClassId === null || (nodeList[index].genericDeviceClass === deviceClassId)) {
                    let ipAddress = nodeList[index].ipv4Address === null ? nodeList[index].ipv6Address : nodeList[index].ipv4Address;
                    deviceChoices.push('Z-Wave Node # ' + nodeList[index].nodeId + ' (' + ipAddress + ')');
                }
            }

            if (deviceChoices.length > 0) {
                // ask the user to select a device
                inquirer.prompt([
                    {
                        type: "list",
                        name: "selectedDevice",
                        message: "Which device do you want to onboard?",
                        choices: deviceChoices,
                        default: true
                    }
                ], function(answers) {
                    // all done. Now we have both parameters we needed.
                    var d = answers.selectedDevice;
                    // parse out the ipAddress
                    var ipAddress = d.substring(d.indexOf('(') + 1);
                    // remove the right parenthesis
                    ipAddress = ipAddress.substring(0, ipAddress.indexOf(')'));

                    if (successCallback) {
                        successCallback(ipAddress, pskPassword, 'Z-Wave device(s) found.');
                        return;
                    }
                });                
            }
            else {
                if (errorCallback) {
                    errorCallback('NoDevices', 'No Z-Wave devices found.');
                }
            }
        }

        if (typeof gatewayIpAddress === 'undefined' || gatewayIpAddress === null) {
            // console.log("SEARCH: Searching for Z/IP Gateway controller IPv4 address via broadcast and unicast on all subnets.");
            ZWaveIP.findGatewayControllerIpv4Address()
            .then(
                function(ipv4Address) {
                    // console.log(" FOUND: Z/IP Gateway controller IPv4 address is: " + ipv4Address + "\n");
                    gatewayIpAddress = ipv4Address;
                    //
                    ZWaveIP.requestNodeListFromGatewayController(gatewayIpAddress, pskIdentity, pskPasswordBuffer)
                    .then(
                        function(nodeList) {
                            searchForDevicesComplete(nodeList);
                        },
                        function(err) {
                            errorCallback('DeviceList', 'Could not retrieve list of nodes from Z/IP gateway controller.');
                            return;
                        }
                    );
                },
                function(err) {
                    errorCallback('LocateGateway', 'Could not find or retrieve Z/IP gateway controller IPv4 address.');
                    return;
                }
            );
        } else {
            ZWaveIP.requestNodeListFromGatewayController(gatewayIpAddress, pskIdentity, pskPasswordBuffer)
            .then(
                function(nodeList) {
                    searchForDevicesComplete(nodeList);
                },
                function(err) {
                    errorCallback('DeviceList', 'Could not retrieve list of nodes from Z/IP gateway controller.');
                    return;
                }
            );
        }

    }
}
