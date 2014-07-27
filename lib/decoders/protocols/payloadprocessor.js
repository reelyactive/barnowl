/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var reelyActivePayloadProcessor = require('./reelyactivepayloadprocessor');
var blePayloadProcessor = require('./blepayloadprocessor');
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
 * Decode the identifier (radio payload) of a tiraid and emit the updated
 * tiraid.  If the payload contains sensor data, that is emitted as
 * a separate event.
 * @param {PayloadProcessor} instance The given instance.
 * @param {object} tiraid The tiloid to decode.
 * @return {Error} Error if present, if not, null.
 */
function handleTiraid(instance, tiraid) {
  var isRadioPayload = (tiraid.identifier.type === identifier.RADIO_PAYLOAD);
  if(!isRadioPayload) {
    return new Error('Expected Tiraid with RadioPayload as identity');
  }

  var isReelyActive = (tiraid.identifier.lengthBytes == 4) ||
                      (tiraid.identifier.lengthBytes == 6);
  var isBluetoothSmart = (tiraid.identifier.lengthBytes >= 9) &&
                         (tiraid.identifier.lengthBytes <= 39);
  var unknownIdentity = (!isReelyActive && !isBluetoothSmart);

  if(unknownIdentity) {
    return new Error('Unknown radio payload identity ' +
                     tiraid.identifier.lengthBytes);
  }
  else {
    var payload = tiraid.identifier.value;

    if(isReelyActive) {
      tiraid.identifier = reelyActivePayloadProcessor.process(payload);
    }
    else if(isBluetoothSmart) {
      tiraid.identifier = blePayloadProcessor.process(payload);
    }
    instance.emit('visibilityEvent', tiraid);
    
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
