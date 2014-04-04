/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var identifier = require('../../common/util/identifier');


/**
 * PayloadProcessor Class
 * Processes radio payloads and emits events based on the content.
 * @constructor
 */
function PayloadProcessor() {
  var self = this;
  this.listenerInstances = [];

  events.EventEmitter.call(this);
};
util.inherits(PayloadProcessor, events.EventEmitter);


/**
 * Convert a raw radio payload into a reelyActive EUI-64 identifier.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {EUI64} EUI-64 identifier.
 */
function toReelyActiveEUI64(payload) {
  var ra28 = new identifier(identifier.RA28, payload.substr(0,7));
  return ra28.toType(identifier.EUI64);
}


/**
 * Convert a raw Bluetooth Low Energy radio payload into an advertiser
 * address.  Note that the payload is LSB first.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {AdvA48} Advertiser address identifier.
 */
function toAdvertiserAddress(payload) {
  var advAString = payload.substr(14,2);
  advAString += payload.substr(12,2);
  advAString += payload.substr(10,2);
  advAString += payload.substr(8,2);
  advAString += payload.substr(6,2);
  advAString += payload.substr(4,2);
  var advA48 = new identifier(identifier.ADVA48, advAString);
  return advA48;
}


/**
 * Convert a raw radio payload into an iBeacon identifier.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {IBEACON} iBeacon identifier.
 */
function toIBeacon(payload) {
  var advA48 = toAdvertiserAddress(payload);
  advA48.uuid = payload.substr(34,32);
  advA48.major = payload.substr(66,4);
  advA48.minor = payload.substr(70,4);
  return advA48;
}


/**
 * Convert a raw radio payload into meaningful data.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {object} Sensor data with EUI-64 identifier.
 */
function toReelyActiveData(payload) {
  var batteryRaw = parseInt(payload.substr(10,2),16) % 64;
  var temperatureRaw = (parseInt(payload.substr(8,3),16) >> 2) % 256;
  var battery = (batteryRaw / 34) + 1.8;
  var temperature = (temperatureRaw - 80) / 2;
  var identifier = toReelyActiveEUI64(payload);
  return {
    identifier: identifier,
    battery: battery,
    temperature: temperature
  }; // TODO: return a more formal JSON or object
}


/**
 * Decode the identifier (radio payload) of a tiraid and emit the updated
 * tiraid.  If the payload contains sensor data, that is emitted as
 * a separate event.
 * @param {PayloadProcessor} instance The given instance.
 * @param {object} tiloid The tiloid to decode.
 * @return {Error} Error if present, if not, null.
 */
function handleTiraid(instance, tiraid) {
  var isRadioPayload = (tiraid.identifier.type === identifier.RADIO_PAYLOAD);
  if(!isRadioPayload) {
    return new Error('Expected Tiloid with RadioPayload as identity');
  }

  var isStandardIdentity = (tiraid.identifier.lengthBytes == 4);
  var isSensorIdentity = (tiraid.identifier.lengthBytes == 6);
  var isReelyActiveAdvertising = (tiraid.identifier.lengthBytes == 32);
  var isIBeacon = (tiraid.identifier.lengthBytes == 38);
  var unknownIdentity = (!isStandardIdentity && !isSensorIdentity &&
                         !isReelyActiveAdvertising && !isIBeacon);

  if(unknownIdentity) {
    return new Error('Unknown radio payload identity ' +
                     tiraid.identifier.lengthBytes);
  }
  else {
    var payload = tiraid.identifier.value;

    if(isStandardIdentity || isSensorIdentity) {
      tiraid.identifier = toReelyActiveEUI64(payload);
    }
    else if(isReelyActiveAdvertising) {
      tiraid.identifier = toAdvertiserAddress(payload);
      tiraid.identifier.completeLocalName = 'reelyActive';
    }
    else if(isIBeacon) {
      tiraid.identifier = toIBeacon(payload);
    }
    instance.emit('visibilityEvent', tiraid);

    if(isSensorIdentity) {
      var sensorData = toReelyActiveData(payload);
      sensorData.timestamp = tiraid.timestamp;
      instance.emit('sensorData', sensorData);
    }
    
    return null;
  }
}


/**
 * Bind the payload processor to a source of visibilityEvents.
 * @param {Object} emitter Emitter of visibilityEvents.
 */
PayloadProcessor.prototype.bind = function(emitter) {
  var self = this;

  this.listenerInstances.push(emitter);
  emitter.on('visibilityEvent', function(tiraid) {
    handleTiraid(self, tiraid);
  });
};


module.exports = PayloadProcessor;
