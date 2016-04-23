/**
 * Copyright reelyActive 2014-2016
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var temporalMixingQueue = require('./core/mixer/temporalmixingqueue');
var locationEngineStrongestN = require('./core/locationenginestrongest/locationenginestrongestn');
var payloadProcessor = require('./decoders/protocols/payloadprocessor');
var time = require('./common/util/time');

var ENABLE_MIXING = false;


/**
 * ProcessorService Class
 * Combines a temporal mixing queue, location engine and payload processor to
 * convert a reelyActive reel packet stream into a stream of location,
 * identity and timestamp.
 * @param {Object} options The options as a JSON object.
 * @constructor
 * @extends {events.EventEmitter}
 */
function ProcessorService(options) {
  var self = this;
  self.requiresMixing = options.enableMixing || ENABLE_MIXING;
  self.locationEngineInstance = new locationEngineStrongestN(options);

  if(self.requiresMixing) {
    self.temporalMixingQueueInstance = new temporalMixingQueue(options);
    self.locationEngineInstance.bind(self.temporalMixingQueueInstance);
  }

  self.payloadProcessorInstance = new payloadProcessor();
  self.payloadProcessorInstance.bind(self.locationEngineInstance);

  self.payloadProcessorInstance.on('visibilityEvent', function(tiraid) {
    self.emit('visibilityEvent', tiraid);
  });

  events.EventEmitter.call(this);
}
util.inherits(ProcessorService, events.EventEmitter);


/**
 * Bind the processor service with a hardware interface.
 * @param {HardwareInterface} emitter Hardware Interface.
 */
ProcessorService.prototype.bind = function(emitter) {
  var self = this;
  if(self.temporalMixingQueueInstance) {
    self.temporalMixingQueueInstance.bind(emitter);
  }
  else {
    self.locationEngineInstance.bind(emitter);
  }
  self.locationEngineInstance.setReelManager(emitter.reelManagerInstance);

  emitter.reelManagerInstance.on('infrastructureEvent', function(data) {
    self.emit('infrastructureEvent', data);
  });
};


module.exports = ProcessorService;
