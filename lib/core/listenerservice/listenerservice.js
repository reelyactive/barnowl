/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var decodeManager = require('./decodemanager');
var reelPacket = require('../../decoders/protocols/reelpacket');


/**
 * ListenerService Class
 * Connects DecodeManagers to Publishers and/or emits packets.
 * @constructor
 * @extends {events.EventEmitter}
 */
function ListenerService() {
  var self = this;
  this.listenerInstances = [];

  events.EventEmitter.call(this);
};
util.inherits(ListenerService, events.EventEmitter);


/**
 * Bind the listener service to an additional data stream and triage the
 * received packets to emit decodedRadioSignalPackets and
 * reelManagementPackets separately.
 * @param {Object} options The options as a JSON object.
 */
ListenerService.prototype.bind = function(options) {
  var self = this;
  var newListener = new decodeManager(options);
  this.listenerInstances.push(newListener);
  newListener.on('reelPacket', function(packet) {
    var isDecodedRadioSignal = 
                           (packet.type == reelPacket.DECODED_RADIO_SIGNAL);
    if(isDecodedRadioSignal) {
      self.emit('decodedRadioSignalPacket', packet);
    }
    else {
      self.emit('reelManagementPacket', packet);
    }
  });
};


module.exports = ListenerService;


