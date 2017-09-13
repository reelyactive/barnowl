/**
 * Copyright reelyActive 2014-2017
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var serialListener = require('./seriallistener');
var udpListener = require('./udplistener');
var bluecatsUdpListener = require('./bluecatsudplistener');
var hciListener = require('./hcilistener');
var eventListener = require('./eventlistener');
var testListener = require('./testlistener');
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
  self.protocol = options.protocol || DEFAULT_PROTOCOL;
  self.path = options.path || DEFAULT_PATH;
  self.retryMilliseconds = options.retryMilliseconds;
  self.prefix = options.prefix;
  if(self.prefix == null) { self.prefix = reelPacket.PREFIX; }
  self.buffer = {};
  self.listener = createListener(self.protocol, self.path);
  handleListenerEvents();


  events.EventEmitter.call(this);

  /**
   * Callback that slices the buffer and emits a packet after decoding
   *   completes.  Decodes again if there's possibly another packet.
   * @param {String} buffer The buffer to work on.
   * @param {Object} origin The origin of the packet.
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
                               self.prefix, handleDecodeComplete);
    }
  }

  /**
   * Handle listener events.
   */
  function handleListenerEvents() {

    self.listener.on('data', function(data, origin, timestamp) {
      var isNewOrigin = (self.buffer[origin] == null);
      if(isNewOrigin) { self.buffer[origin] = ""; }
      self.buffer[origin] += data.toString('hex');
      reelPacketDecoder.decode(self.buffer, origin, timestamp, self.prefix,
                               handleDecodeComplete);
    });

    self.listener.on('error', function(err) {
      console.log("Listener error: " + err.message);
      if(self.retryMilliseconds) {   
        console.log("Attempting to reconnect in " + self.retryMilliseconds +
                    "ms");
        setTimeout(function() {
          self.listener = createListener(self.protocol, self.path);
          handleListenerEvents();
        }, self.retryMilliseconds);
      }
      else { throw err; }
    });
  }
}
util.inherits(DecodeManager, events.EventEmitter);


/**
 * Create a new listener.
 * @param {String} protocol The listener protocol.
 * @param {String} path The listener protocol.
 */
function createListener(protocol, path) {
  switch(protocol) {
    case 'serial':
      return new serialListener(path);
    case 'udp':
      return new udpListener(path);
    case 'bluecats-udp':
      return new bluecatsUdpListener(path);
    case 'hci':
      return new hciListener(path);
    case 'event':
      return new eventListener(path);
    case 'test':
      return new testListener(path);
    default:
      console.log("Unsupported listener protocol: " + protocol);
      return null;
  }
}


module.exports = DecodeManager;
