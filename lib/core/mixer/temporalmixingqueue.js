/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var time = require('../../common/util/time');


/**
 * TemporalMixingQueue Class
 * Groups, based on time, objects which share a common string.
 * @constructor
 * @extends {events.EventEmitter}
 */
function TemporalMixingQueue() {
  var self = this;
  this.emitters = [];
  this.signatures = {};
  this.eventPairs = [];
  this.delayms = 100; // TODO: make this parametric

  events.EventEmitter.call(this);
};
util.inherits(TemporalMixingQueue, events.EventEmitter);


/**
 * Update the queues based on the given packet.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {Packet} packet The DecodedRadioSignal packet.
 */
function handleDecodedRadioSignalPacket(instance, packet)
{
  var signature = packet.identifier.value;
  var isPayloadPresent = (instance.signatures[signature] != null);
  if(isPayloadPresent) {
    instance.signatures[signature].push(packet);
  }
  else {
    var timestamp = time.toFuture(packet.timestamp, instance.delayms);
    var eventPair = { "timestamp": timestamp, "signature": signature };
    var numberOfEvents = instance.eventPairs.push(eventPair);
    var isOnlyEvent = (numberOfEvents == 1);
    instance.signatures[signature] = [ packet ];
    if(isOnlyEvent) {
      setTimeout(handleTimeout, instance.delayms);
    }
  }

  /**
   * Callback that handles all expired timestamps and sets the next timeout.
   */
  function handleTimeout(err) {
    instance.eventPairs.forEach(function (eventPair) {
      var isExpired = time.isInPast(eventPair.timestamp);
      if(isExpired) {
        var signaturePackets = instance.signatures[eventPair.signature];
        var isPackets = (signaturePackets != null);
        if(isPackets) {
          instance.emit('decodedRadioSignalPacketArray', signaturePackets);
          delete instance.signatures[eventPair.signature];
        }
        instance.eventPairs.shift();
      }
    });
    var isLaterTimestamps = (instance.eventPairs.length > 0);
    if(isLaterTimestamps) {
      var nextTimestamp = instance.eventPairs[0].timestamp;
      var delayms = time.getFutureMilliseconds(nextTimestamp);
      setTimeout(handleTimeout, delayms);
    }
  }
}


/**
 * Bind the temporal mixing queue to an event emitter.
 * @param {ListenerService} emitter ListenerService.
 */
TemporalMixingQueue.prototype.bind = function(emitter) {
  var self = this;
  this.emitters.push(emitter);
  emitter.on('decodedRadioSignalPacket', function(packet) {
    handleDecodedRadioSignalPacket(self, packet);
  });
};


module.exports = TemporalMixingQueue;


