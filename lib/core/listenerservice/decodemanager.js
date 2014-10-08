/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var serialListener = require('./seriallistener');
var udpListener = require('./udplistener');
var eventListener = require('./eventlistener');
var reelPacket = require('../../decoders/protocols/reelpacket');
var reelPacketDecoder = require('../../decoders/reelpacketdecoder');
var time = require('../../common/util/time');

var DEFAULT_PROTOCOL = 'udp';
var DEFAULT_PATH = '127.0.0.1:50000';


/**
 * DecodeManager Class
 * Manages the decoding of a data stream from a single listener.
 * @param {Object} options The options as a JSON object.
 * @constructor
 * @extends {events.EventEmitter}
 */
function DecodeManager(options) {
  var self = this;
  this.protocol = options.protocol || DEFAULT_PROTOCOL;
  this.path = options.path || DEFAULT_PATH;
  this.prefix = options.prefix || reelPacket.PREFIX;
  var listener;
  var buffer = {};

  events.EventEmitter.call(this);

  // Create the listener based on the protocol
  if(this.protocol === 'serial') {
    listener = new serialListener(this.path);
  }
  else if(this.protocol === 'udp') {
    listener = new udpListener(this.path);
  }
  else if(this.protocol === 'event') {
    listener = new eventListener(this.path);
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
  function handleDecodeComplete(err, buffer, origin, sliceAt, packet) {
    var isSliceRequired = (sliceAt > 0);
    var isDataLeft = (sliceAt < buffer[origin].length);
    var isChanceOfAnotherPacket = isSliceRequired && isDataLeft;

    if(err) {
      //console.log(err); // Uncomment for debug
    }
    if(isSliceRequired) {
      buffer[origin] = buffer[origin].slice(sliceAt);
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
    var isNewOrigin = (buffer[origin] == null);
    if(isNewOrigin) { buffer[origin] = ""; }
    buffer[origin] += data.toString('hex');
    reelPacketDecoder.decode(buffer, origin, timestamp, handleDecodeComplete);
  });
};
util.inherits(DecodeManager, events.EventEmitter);


module.exports = DecodeManager;
