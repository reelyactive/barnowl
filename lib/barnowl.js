/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var hardwareInterface = require('./hardwareinterface');
var processorService = require('./processorservice');


/**
 * BarnOwl Class
 * Listens, processes and emits reel packets.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function BarnOwl(options) {
  options = options || {};
  var self = this;
  self.hardwareInterfaceInstance = new hardwareInterface();
  self.processorServiceInstance = new processorService(options);
  self.processorServiceInstance.bind(this.hardwareInterfaceInstance);

  self.processorServiceInstance.on('visibilityEvent', function(tiraid) {
    self.emit('visibilityEvent', tiraid);
  });

  self.processorServiceInstance.on('reelEvent', function(data) {
    self.emit('reelEvent', data);
  });

  console.log("reelyActive BarnOwl instance is listening for an open IoT");
  events.EventEmitter.call(this);
}
util.inherits(BarnOwl, events.EventEmitter);


/**
 * Bind the hardware interface to the given data stream.
 * @param {Object} options The options as a JSON object.
 */
BarnOwl.prototype.bind = function(options) {
  var self = this;
  self.hardwareInterfaceInstance.bind(options);
};


module.exports = BarnOwl;
