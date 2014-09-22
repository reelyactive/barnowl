/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var serialListener = require('./seriallistener');
var udpListener = require('./udplistener');
var eventListener = require('./eventlistener');
var reelPacketDecoder = require('../../decoders/reelpacketdecoder');
var time = require('../../common/util/time');


/**
 * DecodeManager Class
 * Manages the decoding of a data stream from a single listener.
 * @param {string} protocol Listener protocol, ex: serial.
 * @param {string} source Listener source, ex: /dev/ttyUSB0.
 * @constructor
 * @extends {events.EventEmitter}
 */
function DecodeManager(protocol, source) {
  var self = this;
  var listener;
  var buffer;

  events.EventEmitter.call(this);

  // Create the listener based on the protocol
  if(protocol === 'serial') {
    listener = new serialListener(source);
  }
  else if(protocol === 'udp') {
    listener = new udpListener(source);
  }
  else if(protocol === 'event') {
    listener = new eventListener(source);
  }
  else {
    console.log("Unsupported protocol: " + protocol);
  }

  /**
   * Callback that slices the buffer and emits a packet after decoding
   *   completes.  Decodes again if there's possibly another packet.
   * @param {number} sliceAt Position in buffer to trim up to.
   * @param {Packet} packet Packet to emit, if valid.
   */
  function handleDecodeComplete(err, sliceAt, packet) {
    var isSliceRequired = (sliceAt > 0);
    var isDataLeft = (sliceAt < buffer.length);
    var isChanceOfAnotherPacket = isSliceRequired && isDataLeft;

    if(err) {
      //console.log(err); // Uncomment for debug
    }
    if(isSliceRequired) {
      buffer = buffer.slice(sliceAt);
    }
    if(packet) {
      self.emit('reelPacket', packet);
    }
    if(isChanceOfAnotherPacket) {
      reelPacketDecoder.decode(buffer, packet.origin, packet.timestamp,
                               handleDecodeComplete);
    }
  }

  // Listen for data emission
  listener.on('data', function(data, origin, timestamp) {
    buffer += data.toString('hex');
    reelPacketDecoder.decode(buffer, origin, timestamp, handleDecodeComplete);
  });
};
util.inherits(DecodeManager, events.EventEmitter);


module.exports = DecodeManager;
