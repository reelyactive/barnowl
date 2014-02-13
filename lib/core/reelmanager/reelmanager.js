/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var reelPacket = require('../../decoders/protocols/reelPacket');
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
};
util.inherits(ReelManager, events.EventEmitter);


/**
 * Update the tables based on ReelceiverStatistics packet.
 * @param {ReelManager} instance The given ReelManager instance.
 * @param {Packet} packet The ReelceiverStatistics packet.
 */
function handleReelceiverStatistics(instance, packet) {
  var originKey = packet.origin;
  var isNewOriginKey = (instance.origins[originKey] == null);
  var reelOffset = packet.reelOffset;
  var deviceIdentifier = packet.identifier;

  if(isNewOriginKey) {
    instance.origins[originKey] = [];
  }
  instance.origins[originKey][reelOffset] = deviceIdentifier;
  
  // TODO: store more data about the reelceivers
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
    var isReelceiverStatistics = 
                           (packet.type === reelPacket.REELCEIVER_STATISTICS);
    if(isReelceiverStatistics) {
      handleReelceiverStatistics(self, packet);
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
      var decoderIdentifier = self.origins[decoding.origin][decoding.reelOffset];
      if(decoderIdentifier != null) {
        decoding.identifier = decoderIdentifier.toType(identifier.EUI64);
      }
      else {
        decoding.identifier = null;
      }
    }
    else {
      decoding.identifier = null;
    }
  });

  callback(err);
};


module.exports = ReelManager;
