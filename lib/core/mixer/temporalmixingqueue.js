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
function TemporalMixingQueue(delayms) {
  var self = this;
  this.emitters = [];
  this.signatures = {};
  this.delayms = delayms;

  events.EventEmitter.call(this);
};
util.inherits(TemporalMixingQueue, events.EventEmitter);


/**
 * Update the queue based on the given packet.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {Packet} packet The DecodedRadioSignal packet.
 */
function handleDecodedRadioSignalPacket(instance, packet)
{
  var signature = packet.identifier.value;
  var signatureEvent = instance.signatures[signature];
  var isSignaturePresent = (typeof signatureEvent !== 'undefined'
                            && signatureEvent) != false;

  // The given signature is already present in the queue
  if(isSignaturePresent) {
    var signaturePackets = instance.signatures[signature].packets;
    var isOriginPresent = false;
    signaturePackets.forEach(function (signaturePacket) {
      if(signaturePacket.origin == packet.origin) {
        isOriginPresent = true;
      }
    });

    if(isOriginPresent) {
      pushOut(signature, packet);
    }
    else {
      instance.signatures[signature].packets.push(packet);
    }
  }

  // The given signature is not present in the queue
  else {
    instance.signatures[signature] = createSignatureEvent(packet);
    var isOnlySignature = (Object.keys(instance.signatures).length == 1);
    if(isOnlySignature) {
      setTimeout(handleTimeout, instance.delayms);
    }
  }

  /**
   * Callback that handles all expired timestamps and sets the next timeout.
   */
  function handleTimeout(err) {
    var nextTimeout = time.getFuture(instance.delayms);
    for(signature in instance.signatures) {
      var signatureEvent = instance.signatures[signature];
      var isExpired = time.isInPast(signatureEvent.timeout);
      var isEarlier = time.isEarlier(signatureEvent.timeout, nextTimeout);
      if(isExpired) {
        pushOut(signature);
      }
      else if(isEarlier) {
        nextTimeout = signatureEvent.timeout;
      }
    }
    var isLaterTimestamps = (Object.keys(instance.signatures).length > 0);
    if(isLaterTimestamps) {
      var delayms = time.getFutureMilliseconds(nextTimeout);
      setTimeout(handleTimeout, delayms);
    }
  }

  /**
   * Emit the signature packets and, optionally, provide a replacement for the
   * given signature
   */
  function pushOut(signature, replacement) {
    var signaturePackets = instance.signatures[signature].packets;
    var isPackets = (signaturePackets != null);
    if(isPackets) {
      instance.emit('decodedRadioSignalPacketArray', signaturePackets);
    }

    if(replacement) {
      instance.signatures[signature] = createSignatureEvent(replacement);
    }
    else {
      delete instance.signatures[signature];
    }
  }

  /**
   * Create a signature event based on the given packet and the current time
   */
  function createSignatureEvent(packet) {
    var timeout = time.getFuture(instance.delayms);
    var signatureEvent = { "timeout": timeout,
                           "packets": [ packet ] };
    return signatureEvent;    
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


