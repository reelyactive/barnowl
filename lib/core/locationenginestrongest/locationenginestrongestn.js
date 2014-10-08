/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var time = require('../../common/util/time');
var identifier = require('../../common/util/identifier');

var DEFAULT_N = 1;


/**
 * LocationEngineStrongestN Class
 * Determines which single decoding was the strongest for a given transmission.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function LocationEngineStrongestN(options) {
  var self = this;
  this.n = options.n || DEFAULT_N;
  this.listenerInstances = [];
  this.reelManagerInstance = null;

  events.EventEmitter.call(this);
};
util.inherits(LocationEngineStrongestN, events.EventEmitter);


/**
 * Determine the earliest timestamp in a packet array or use the current
 * time if for some reason it is earlier.
 * @param {array} packets The array of DecodedRadioSignal packets.
 * @returns {string} The earliest timestamp.
 */
function getEarliestTimestamp(packets) {
  var earliestTimestamp = time.getCurrent();
  packets.forEach(function (packet) {
    var packetTimestamp = packet.timestamp;
    var isEarlier = time.isEarlier(packetTimestamp, earliestTimestamp);
    if(isEarlier) {
      earliestTimestamp = packetTimestamp;
    }
  });

  return earliestTimestamp;
}


/**
 * Update the given array of n-strongest decodings based on the rssi of the
 * given decoding.
 * @param {number} n The maximum number of decodings to keep.
 * @param {array} strongest The array of strongest decodings.
 * @param {object} decoding The decoding information.
 * @param {StreamOrigin} origin The origin of the data stream.
 */
function updateStrongestArray(n, strongest, decoding, origin) {
  decoding.origin = origin;

  var isUnderfilled = (strongest.length < n);
  if(isUnderfilled) {
    strongest.push(decoding);    
  }
  else {
    var lastIndex = strongest.length - 1;
    var weakest = strongest[lastIndex].rssi;
    var isStronger = (decoding.rssi > weakest);
    if(isStronger) {
      strongest[lastIndex] = decoding;
    }
  }

  if(isUnderfilled || isStronger) {
    strongest.sort(function (a,b) {
      return b.rssi - a.rssi;
    });
  }
}


/**
 * Determine the n-strongest decodings in a packetArray and order them by
 * rssi.
 * @param {array} packets The array of DecodedRadioSignal packets.
 * @returns {array} Array of decodings with origins.
 */
function getStrongestNDecodings(n, packets) {
  var strongest = [];
  var strongestRssi = 0;

  packets.forEach(function (packet) {
    var origin = packet.origin;
    packet.radioDecodings.forEach(function (decoding) {
      updateStrongestArray(n, strongest, decoding, origin);
    });
  });

  return strongest;
}


/**
 * Update the given visibility event so that each decoding has a decoder
 * identifier, then emit the event.
 * @param {LocationEngineStrongestN} instance The given instance.
 * @param {array} decodings The array of decodings with origins.
 */
function updateDecoderIdentifiersAndEmit(instance, visibilityEvent) {
  var isReelManagerBound = (instance.reelManagerInstance != null);
  if(!isReelManagerBound) {
    return;
  }
  var decodings = visibilityEvent.radioDecodings;
  instance.reelManagerInstance.setDecoderIdentifiers(decodings,
                                            handleDecoderIdentifiersComplete);

  /**
   * Callback that handles an updated array of decodings, removing the
   * reelOffsets and origins and emitting the visibilityEvent.
   */
  function handleDecoderIdentifiersComplete(err) {
    decodings.forEach(function (decoding) {
      delete decoding.reelOffset;
      delete decoding.origin;
    });
    instance.emit('visibilityEvent', visibilityEvent);
  } 
}


/**
 * Determine the strongest N decoders in an array of DecodedRadioSignal
 * packets.
 * @param {LocationEngineStrongestN} instance The given instance.
 * @param {array} packets The array of DecodedRadioSignal packets.
 */
function handleDecodedRadioSignal(instance, packets) {
  var isPackets = (packets != null);
  if(isPackets) {
    var visibilityEvent = {};
    visibilityEvent.identifier = packets[0].identifier;
    visibilityEvent.timestamp = getEarliestTimestamp(packets);
    visibilityEvent.radioDecodings = getStrongestNDecodings(instance.n, packets);
    updateDecoderIdentifiersAndEmit(instance, visibilityEvent);
  }
}


/**
 * Bind the location engine to a temporal mixing queue which acts as a source
 * of decodedRadioSignalPacketArray events or a hardware interface which acts
 * as a source of decodedRadioSignalPacket events.
 * @param {EventEmitter} emitter TemporalMixingQueue or HardwareInterface.
 */
LocationEngineStrongestN.prototype.bind = function(emitter) {
  var self = this;

  this.listenerInstances.push(emitter);
  emitter.on('decodedRadioSignalPacketArray', function(packetArray) {
    handleDecodedRadioSignal(self, packetArray);
  });
  emitter.on('decodedRadioSignalPacket', function(packet) {
    var packetArray = [ packet ];
    handleDecodedRadioSignal(self, packetArray);
  });
};


/**
 * Set the reel manager that this instance should use.
 * @param {ReelManager} reelManager The ReelManager instance.
 */
LocationEngineStrongestN.prototype.setReelManager = function(reelManager) {
  var self = this;
  
  this.reelManagerInstance = reelManager;
};


module.exports = LocationEngineStrongestN;
