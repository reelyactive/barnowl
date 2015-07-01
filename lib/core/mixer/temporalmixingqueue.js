/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var reelib = require('reelib');

var DEFAULT_MIXING_DELAY_MILLISECONDS = 25;
var DEFAULT_MIN_MIXING_DELAY_MILLISECONDS = 5;


/**
 * TemporalMixingQueue Class
 * Groups, based on time, objects which share a common string.
 * @param {Object} options The options as a JSON object.
 * @constructor
 * @extends {events.EventEmitter}
 */
function TemporalMixingQueue(options) {
  var self = this;
  self.delayms = options.mixingDelayMilliseconds || 
                 DEFAULT_MIXING_DELAY_MILLISECONDS;
  self.minSleepMilliseconds = options.minMixingDelayMilliseconds ||
                              DEFAULT_MIN_MIXING_DELAY_MILLISECONDS;
  self.emitters = [];
  self.signatures = {};

  self.handleTimeoutEvents();

  events.EventEmitter.call(self);
}
util.inherits(TemporalMixingQueue, events.EventEmitter);


/**
 * Handle all expired timeouts.  This function sets itself to run again when
 * the next timeout is due to expire, or after the minimum sleep milliseconds,
 * whichever is greater.
 */
TemporalMixingQueue.prototype.handleTimeoutEvents = function() {
  var self = this;
  var nextTimeout = reelib.time.getFuture(self.delayms);

  // Iterate through all signatures in the queue
  for(var signature in self.signatures) {
    var signatureEvent = self.signatures[signature];

    // Timeout expired, emit the packet array
    if(reelib.time.isInPast(signatureEvent.timeout - 1)) {
      emitPacketArray(self, signature, false);
    }

    // Find the next earliest timeout
    else if(reelib.time.isEarlier(signatureEvent.timeout, nextTimeout)) {
      nextTimeout = signatureEvent.timeout;
    }
  }

  var timeoutMilliseconds = Math.max(reelib.time.getCurrentOffset(nextTimeout),
                                     self.minSleepMilliseconds);
  setTimeout(self.handleTimeoutEvents.bind(self), timeoutMilliseconds);
};


/**
 * Update the queue based on the given packet.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {Packet} packet The DecodedRadioSignal packet.
 */
function handleDecodedRadioSignalPacket(instance, packet)
{
  var signature = packet.identifier.value;
  var signatureEvent = instance.signatures[signature];
  var isSignaturePresent = ((typeof signatureEvent !== 'undefined') &&
                            signatureEvent);

  // The given signature is already present in the queue
  if(isSignaturePresent) {

    var originPacket = getSignatureOriginPacket(instance, signature,
                                                packet.origin);
    var isOriginPresent = (originPacket !== null);

    // The given origin is already present for this signature
    if(isOriginPresent) {

      var isUnacceptableDuplicate = false; // TODO: the logic for this
                                           //       in external function

      // Duplicate origin/offset is detected and unacceptable
      if(isUnacceptableDuplicate) {
        emitPacketArray(instance, signature, true);
        createSignatureEvent(instance, signature);
        addSignaturePacket(instance, signature, packet);
      }

      // Merge the origins
      else {
        mergePackets(instance, originPacket, packet);
      }
    }

    // The given origin needs to be added for this signature
    else {
      addSignaturePacket(instance, signature, packet);
    }

  }

  // The given signature needs to be created in the queue
  else {
    createSignatureEvent(instance, signature);
    addSignaturePacket(instance, signature, packet);
  }

}


/**
 * Create a new signature with the given timeout and empty packets array.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {String} signature The signature.
 */
function createSignatureEvent(instance, signature) {
  var timeout = reelib.time.getFuture(instance.delayms);
  instance.signatures[signature] = { timeout: timeout, packets: [] };
}


/**
 * Add the given packet to the given signature.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {String} signature The signature.
 * @param {DecodedRadioSignal} packet The packet to add
 */
function addSignaturePacket(instance, signature, packet) {
  instance.signatures[signature].packets.push(packet);
}


/**
 * Merge the two given packets, averaging RSSI values from common reelOffsets.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {DecodedRadioSignal} targetPacket The packet to update.
 * @param {DecodedRadioSignal} sourcePacket The packet from which to source.
 */
function mergePackets(instance, targetPacket, sourcePacket) {
  var sourceDecodings = sourcePacket.radioDecodings;
  var targetDecodings = targetPacket.radioDecodings;

  // Iterate through all source offsets
  for(var cSourceOffset = 0; cSourceOffset < sourceDecodings.length;
      cSourceOffset++) {
    var sourceDecoding = sourceDecodings[cSourceOffset];
    var sourceOffset = sourceDecoding.reelOffset;
    var isMerged = false;
    
    // Look for a match in the target offsets
    for(var cTargetOffset = 0; cTargetOffset < targetDecodings.length;
        cTargetOffset++) {
      var targetDecoding = targetDecodings[cTargetOffset];
      var targetOffset = targetDecoding.reelOffset;
      if(sourceOffset === targetOffset) {
        isMerged = true;
        mergeDecodings(targetDecoding, sourceDecoding);
      }
    }

    // No match found, push new offset to target
    if(!isMerged) {
      targetDecodings.push(sourceDecoding);
    }
  }
}


/**
 * Merge the two given packets, averaging RSSI values from common reelOffsets.
 * @param {Object} targetDecoding The decoding to update.
 * @param {Object} sourceDecoding The decoding from which to source.
 */
function mergeDecodings(targetDecoding, sourceDecoding) {
  var rssiSum = 0;

  if(targetDecoding.rssiArray) {
    targetDecoding.rssiArray.push(sourceDecoding.rssi);
  }
  else {
    targetDecoding.rssiArray = [ targetDecoding.rssi, sourceDecoding.rssi ];
  }

  for(var cRssi = 0; cRssi < targetDecoding.rssiArray.length; cRssi++) {
    rssiSum += targetDecoding.rssiArray[cRssi];
  }

  targetDecoding.rssi = Math.round(rssiSum / targetDecoding.rssiArray.length);
}


/**
 * Get the packet with the same origin as that given, for the given signature.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {String} signature The signature.
 * @param {String} origin The origin to search for.
 * @return {DecodedRadioSignal} packet if found, null otherwise.
 */
function getSignatureOriginPacket(instance, signature, origin) {
  var packets = instance.signatures[signature].packets;

  for(var cPacket = 0; cPacket < packets.length; cPacket++) {
    var packet = instance.signatures[signature].packets[cPacket];
    if(origin === packet.origin) {
      return packet;
    }
  }

  return null;
}


/**
 * Emit the packet array for the given signature.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {String} signature The signature.
 * @param {boolean} keepSignature Should the signature be kept in memory?
 */
function emitPacketArray(instance, signature, keepSignature) {
  var signaturePackets = instance.signatures[signature].packets;

  instance.emit('decodedRadioSignalPacketArray', signaturePackets);
  signaturePackets = [];

  if(!keepSignature) {
    delete instance.signatures[signature];
  }
}


/**
 * Bind the temporal mixing queue to an event emitter.
 * @param {ListenerService} emitter ListenerService.
 */
TemporalMixingQueue.prototype.bind = function(emitter) {
  var self = this;
  self.emitters.push(emitter);
  emitter.on('decodedRadioSignalPacket', function(packet) {
    handleDecodedRadioSignalPacket(self, packet);
  });
};


module.exports = TemporalMixingQueue;
