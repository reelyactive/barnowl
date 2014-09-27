/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var hardwareInterface = require('./hardwareinterface');
var processorService = require('./processorservice');


/**
 * BarnOwl Class
 * Listens, processes and emits reel packets.
 * @param {number} n The number of strongest decodings to consider.
 * @param {boolean} requiresMixing Is mixing required due to multiple sources?
 * @constructor
 */
function BarnOwl(n, requiresMixing) {
  var self = this;
  this.hardwareInterfaceInstance = new hardwareInterface();
  this.processorServiceInstance = new processorService(n, requiresMixing);
  this.processorServiceInstance.bind(this.hardwareInterfaceInstance);

  this.processorServiceInstance.on('visibilityEvent', function(tiraid) {
    self.emit('visibilityEvent', tiraid);
  });
  this.processorServiceInstance.on('sensorData', function(sensorData) {
    self.emit('sensorData', sensorData);
  });

  console.warn("reelyActive BarnOwl instance is listening for an open IoT");
  events.EventEmitter.call(this);
};
util.inherits(BarnOwl, events.EventEmitter);


/**
 * Bind the hardware interface to the given data stream.
 * @param {string} protocol Listener protocol, ex: serial.
 * @param {string} source Listener source, ex: /dev/ttyUSB0.
 */
BarnOwl.prototype.bind = function(protocol, source) {
  var self = this;
  this.hardwareInterfaceInstance.bind(protocol, source);
}


module.exports = BarnOwl;
