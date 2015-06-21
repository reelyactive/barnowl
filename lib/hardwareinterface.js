/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var listenerService = require('./core/listenerservice/listenerservice');
var reelManager = require('./core/reelmanager/reelmanager');


/**
 * HardwareInterface Class
 * Combines a listener service and reel manager to receive and process reel
 * communication packets from reelyActive hardware.
 * @constructor
 * @extends {events.EventEmitter}
 */
function HardwareInterface() {
  var self = this;
  this.listenerServiceInstance = new listenerService();
  this.reelManagerInstance = new reelManager();
  this.reelManagerInstance.bind(this.listenerServiceInstance);

  this.listenerServiceInstance.on('decodedRadioSignalPacket', function(packet) {
    self.emit('decodedRadioSignalPacket', packet);
  });

  events.EventEmitter.call(this);
}
util.inherits(HardwareInterface, events.EventEmitter);


/**
 * Bind the listener service for the given data stream.
 * @param {Object} options The options as a JSON object.
 */
HardwareInterface.prototype.bind = function(options) {
  var self = this;
  this.listenerServiceInstance.bind(options);
};


module.exports = HardwareInterface;


