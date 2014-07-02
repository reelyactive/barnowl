/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var temporalMixingQueue = require('./core/mixer/temporalmixingqueue');
var locationEngineStrongestN = require('./core/locationenginestrongest/locationenginestrongestn');
var payloadProcessor = require('./decoders/protocols/payloadprocessor');


/**
 * ProcessorService Class
 * Combines a temporal mixing queue, location engine and payload processor to
 * convert a reelyActive reel packet stream into a stream of location,
 * identity and timestamp.
 * @param {number} n The number of strongest decodings to consider.
 * @constructor
 * @extends {events.EventEmitter}
 */
function ProcessorService(n) {

  var self = this;
  this.temporalMixingQueueInstance = new temporalMixingQueue();
  this.locationEngineInstance = new locationEngineStrongestN( n );
  this.locationEngineInstance.bind( this.temporalMixingQueueInstance );

  this.payloadProcessorInstance = new payloadProcessor();
  this.payloadProcessorInstance.bind( this.locationEngineInstance );

  this.payloadProcessorInstance.on('visibilityEvent', function( tiraid ) {

    self.emit('visibilityEvent', tiraid);

  });
  this.payloadProcessorInstance.on('sensorData', function( sensorData ) {
    self.emit( 'sensorDataEvent', sensorData );
  });

  events.EventEmitter.call( this );
};
util.inherits( ProcessorService, events.EventEmitter );


/**
 * Bind the processor service with a hardware interface.
 * @param {HardwareInterface} emitter Hardware Interface.
 */
ProcessorService.prototype.bind = function( emitter ) {

  var self = this;
  
  this.temporalMixingQueueInstance.bind( emitter );
  this.locationEngineInstance.setReelManager( emitter.reelManagerInstance );

};


module.exports = ProcessorService;


