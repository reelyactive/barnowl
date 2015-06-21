/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var identifier = require('../../common/util/identifier');


/**
 * Process a raw reelyActive radio payload into semantically meaningful
 * information.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {EUI64} EUI-64 identifier.
 */
function process(payload) {
  var ra28 = new identifier(identifier.RA28, payload.substr(0,7));
  var eui64 = ra28.toType(identifier.EUI64);
  eui64.flags = toReelyActiveFlags(payload.substr(7,1));
  if(payload.length === 12) {
    eui64.data = toReelyActiveData(payload.substr(8,4));
  }
  return eui64;
}


/**
 * Convert a raw radio sensor data payload.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {object} Sensor data.
 */
function toReelyActiveFlags(payload) {
  var flags = parseInt(payload,16);
  var transmissionCount = flags >> 2;
  return { transmissionCount: transmissionCount };
}


/**
 * Convert a raw radio sensor data payload.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {object} Sensor data.
 */
function toReelyActiveData(payload) {
  var batteryRaw = parseInt(payload.substr(2,2),16) % 64;
  var temperatureRaw = (parseInt(payload.substr(0,3),16) >> 2) % 256;
  var battery = ((batteryRaw / 34) + 1.8).toFixed(2) + "V";
  var temperature = ((temperatureRaw - 80) / 2).toFixed(1) + "C";
  return {
    battery: battery,
    temperature: temperature
  };
}


module.exports.process = process;
