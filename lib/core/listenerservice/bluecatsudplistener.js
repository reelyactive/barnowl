/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


var dgram = require('dgram');
var util = require('util');
var events = require('events');
var time = require('../../common/util/time');
var reelPacket = require('../../decoders/protocols/reelpacket');


// Constants
var PROTOCOL = 'bluecats-udp';
var RSSI_OFFSET = 100;
var ANNOUNCE_INTERVAL_MILLISECONDS = 15000;


/**
 * BlueCatsUdpListener Class
 * Listens for BlueCats data on a UDP port and emits this data
 * @param {string} path Path to UDP host and port, ex: 192.168.1.1:50000.
 * @constructor
 * @extends {events.EventEmitter}
 */
function BlueCatsUdpListener(path) {
  var self = this;
  var pathElements = path.split(':');
  var host = pathElements[0];
  var port = pathElements[1];
  var server = dgram.createSocket('udp4');

  self.receivers = [];
  self.lastAnnounceTimes = {};

  events.EventEmitter.call(this);

  server.on('listening', function () {
    var address = server.address();
    console.log('UDP Listening (BlueCats) on ' + address.address + ':'
                + address.port);
  });
  server.on('message', function (data, remote) {
    var origin = remote.address + ':' + remote.port;
    var timestamp = time.getCurrent();
    var reelData = handleBlueCatsData(self, data, origin);
    if(reelData) {
      self.emit('data', reelData, origin, timestamp);
    }
  });
  server.on('error', function (err) {
    server.close();
    self.emit('error', err);
  });

  server.bind(port, host);
}
util.inherits(BlueCatsUdpListener, events.EventEmitter);


/**
 * Handle the BlueCats data and return a reel packet, if applicable.
 * @param {Buffer} data UDP payload data.
 * @param {String} origin The origin of the UDP packet.
 */
function handleBlueCatsData(instance, data, origin) {
  var json;

  try {
    json = JSON.parse(data.toString());
  }
  catch(err) {
    // Perhaps handle errors in future
  }

  // Abort if any of the requisite properties are missing
  if(!json.hasOwnProperty('edgeMAC') || !json.hasOwnProperty('beaconMAC') ||
     !json.hasOwnProperty('rssiSmooth') || !json.hasOwnProperty('adData')) {
    return null;
  }

  handleBlueCatsEdge(instance, json.edgeMAC.toLowerCase(), origin);

  var blePacketLengthBytes = (json.adData.length / 2) + 6;
  var reelHeader = ('0' + (blePacketLengthBytes + 2).toString(16)).substr(-2);
  var blePacketLength = ('0' + blePacketLengthBytes.toString(16)).substr(-2);
  var bleAddress = json.beaconMAC.substr(10,2) +
                   json.beaconMAC.substr(8,2) +
                   json.beaconMAC.substr(6,2) +
                   json.beaconMAC.substr(4,2) +
                   json.beaconMAC.substr(2,2) +
                   json.beaconMAC.substr(0,2);

  var reelData = reelPacket.PREFIX;                    // Prefix
  reelData += reelHeader;                              // Header
  reelData += '01';                                    // Count
  reelData += 4;                                       // txAdd (Always random)
  reelData += 0;                                       // Type (FIX!)
  reelData += blePacketLength;                         // Length
  reelData += bleAddress.toLowerCase();                // Address
  reelData += json.adData.toLowerCase();               // PDU
  reelData += '00';                                    // Reel pos (FIX!)
  reelData += ('00' + (json.rssiSmooth + RSSI_OFFSET).toString(16)).substr(-2);
                                                       // RSSI
  return reelData;
}


/**
 * Handle the BlueCats edge relay, sending an announce if it is new.
 * @param {String} receiverId The Edge Relay MAC.
 * @param {String} origin The origin of the UDP packet.
 */
function handleBlueCatsEdge(instance, receiverId, origin) {

  // New receiverId, add to list
  if(instance.receivers.indexOf(receiverId) < 0) {
    instance.receivers.push(receiverId);
  }

  var lastAnnounceTime = instance.lastAnnounceTimes[receiverId];
  var currentTime = new Date();

  // Due for a periodic announce message
  if(!lastAnnounceTime ||
     ((currentTime - ANNOUNCE_INTERVAL_MILLISECONDS) > lastAnnounceTime)) { 
    var reelOffset = ('0' + (instance.receivers.length - 1).toString(16))
                     .substr(-2);
    var simulatedPacket = new Buffer('aaaa70' + reelOffset +
                                     receiverId.substr(4,8) +
                                     '00000000000000000000000000000000','hex');
    instance.emit('data', simulatedPacket, origin, currentTime);
    instance.lastAnnounceTimes[receiverId] = currentTime;
  }
}


module.exports = BlueCatsUdpListener;
module.exports.PROTOCOL = PROTOCOL;
