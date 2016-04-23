/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var reelib = require('reelib');
var reelPacket = require('../../decoders/protocols/reelpacket');
var identifier = require('../../common/util/identifier');


/**
 * ReelManager Class
 * Manages the composition of reels.
 * @constructor
 */
function ReelManager() {
  var self = this;
  this.listenerInstances = [];
  this.origins = {};

  events.EventEmitter.call(this);
}
util.inherits(ReelManager, events.EventEmitter);


/**
 * Emit an infrastructure event based on ReelceiverStatistics packet.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {Packet} packet The ReelceiverStatistics packet.
 */
function handleReelceiverStatistics(instance, packet) {
  var data = {};
  data.type = 'reelceiverStatistics';
  data.timestamp = packet.timestamp;
  data.time = reelib.time.toTimestamp(packet.timestamp);
  data.receiverId = packet.identifier.toType(identifier.EUI64).value;
  data.uptimeSeconds = packet.uptime || 0;
  data.sendCount = packet.sendCount || 0;
  data.crcPass = packet.crcPass || 0;
  data.crcFail = packet.crcFail || 0;
  data.maxRSSI = packet.maxRSSI || 0;
  data.avgRSSI = packet.avgRSSI || 0;
  data.minRSSI = packet.minRSSI || 0;
  data.temperatureCelcius = packet.temperature || 0;
  data.radioVoltage = packet.radioVoltage || 0;
  instance.emit('infrastructureEvent', data);
}


/**
 * Update the tables based on ReelAnnounce packet.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {Packet} packet The ReelAnnounce packet.
 */
function handleReelAnnounce(instance, packet) {
  var originKey = packet.origin;
  var isNewOriginKey = (Object.keys(instance.origins).indexOf(originKey) < 0);
  var deviceCounts;
  var reelOffsets;
  var deviceCount = packet.deviceCount;
  var deviceIdentifier = packet.identifier;

  if(isNewOriginKey) {
    initialiseOrigin(instance, originKey);
  }
  deviceCounts = instance.origins[originKey].deviceCounts;
  reelOffsets = instance.origins[originKey].reelOffsets;

  // Furthest device from the hub so far
  if(deviceCount >= deviceCounts.length) {
    for(var cCount = deviceCounts.length; cCount < deviceCount; cCount++) {
      var unknownDevice = new identifier();
      deviceCounts[cCount] = unknownDevice;    // Fill any reel gaps 
      reelOffsets.splice(0, 0, unknownDevice); //   with 'unknown' devices
    }
    deviceCounts[deviceCount] = deviceIdentifier;
    reelOffsets.splice(0, 0, deviceIdentifier);
  }

  else {
    var expectedDeviceIdentifier = deviceCounts[deviceCount];

    // The device fills in one of the gaps in the reel
    if(expectedDeviceIdentifier.type === identifier.UNDEFINED) {
      var reelOffset = reelOffsets.length - deviceCount - 1;
      deviceCounts[deviceCount] = deviceIdentifier;
      reelOffsets[reelOffset] = deviceIdentifier;
    }

    // Device identifier conflict, physical change to reel detected!
    else if(expectedDeviceIdentifier.value !== deviceIdentifier.value) {
      initialiseOrigin(instance, originKey); // Reset!
    }
  }
}


/**
 * Initialise/reset the given origin key.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {String} originKey The origin key.
 */
function initialiseOrigin(instance, originKey) {
  instance.origins[originKey] = { reelOffsets: [],
                                  deviceCounts: [] };
}


/**
 * Bind the reel manager to a listener service and handle received
 * reelManagementPackets.
 * @param {ListenerService} emitter ListenerService.
 */
ReelManager.prototype.bind = function(emitter) {
  var self = this;

  this.listenerInstances.push(emitter);
  emitter.on('reelManagementPacket', function(packet) {
    switch(packet.type) {
      case reelPacket.REELCEIVER_STATISTICS:
        handleReelceiverStatistics(self, packet);
        break;
      case reelPacket.REEL_ANNOUNCE:
        handleReelAnnounce(self, packet);
        break;
    }
  });
};


/**
 * Look up and append the reelceiver ID for each decoding in the given array.
 * @param {array} decodings Array of decodings with offsets and origins.
 * @param {callback} callback Function to call on completion.
 */
ReelManager.prototype.setDecoderIdentifiers = function(decodings, callback) {
  var self = this;
  var err;

  decodings.forEach(function (decoding) {
    if(self.origins[decoding.origin]) {
      var decoderIdentifier = self.origins[decoding.origin].reelOffsets[decoding.reelOffset];
      if(decoderIdentifier != null) {
        decoding.identifier = decoderIdentifier.toType(identifier.EUI64);
      }
      else {
        decoding.identifier = new identifier();
      }
    }
    else {
      decoding.identifier = new identifier();
    }
  });

  callback(err);
};


module.exports = ReelManager;
