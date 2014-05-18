/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

// Constants (Prefix)
var PREFIX = 'aaaa';

// Constants (Type)
var TYPE_DECODED_RADIO_SIGNAL = 'DecodedRadioSignal';
var TYPE_REEL_ANNOUNCE = 'ReelAnnounce';
var TYPE_REELCEIVER_STATISTICS = 'ReelceiverStatistics';
var TYPE_UNDEFINED = 'Undefined';

// Constants (DecodedRadioSignal Packet)
var DECODED_RADIO_SIGNAL_MIN_PACKET_LENGTH_BYTES = 0;
var DECODED_RADIO_SIGNAL_MAX_PACKET_LENGTH_BYTES = 39;
var DECODED_RADIO_SIGNAL_OVERHEAD_BYTES = 2;
var DECODED_RADIO_SIGNAL_BYTES_PER_DECODING = 2;

// Constants (ReelAnnounce Packet)
var REEL_ANNOUNCE_PACKET_LENGTH_BYTES = 22;
var REEL_ANNOUNCE_REEL_PACKET_CODE = 0x70;

// Constants (ReelceiverStatistics Packet)
var REELCEIVER_STATISTICS_PACKET_LENGTH_BYTES = 23;
var REELCEIVER_STATISTICS_REEL_PACKET_CODE = 0x78;


/**
 * ReelPacket Class
 * Represents a reelyActive reel packet
 * @param {string} type Type of reel packet.
 * @param {Object} content Content of the given packet type.
 * @constructor
 */
function ReelPacket(type, content, origin, timestamp) {
  var isContent = (content != null);

  // Constructor for DecodedRadioSignal
  if((type == TYPE_DECODED_RADIO_SIGNAL) && isContent) {
    this.type = TYPE_DECODED_RADIO_SIGNAL;
    this.lengthBytes = DECODED_RADIO_SIGNAL_OVERHEAD_BYTES +
                       content.payloadLength + (content.receiverCount *
                       DECODED_RADIO_SIGNAL_BYTES_PER_DECODING);
    this.receiverCount = content.receiverCount;
    this.identifier = content.identifier;
    this.radioDecodings = content.radioDecodings;
  }

  // Constructor for ReelAnnounce
  else if((type == TYPE_REEL_ANNOUNCE) && isContent) {
    this.type = TYPE_REEL_ANNOUNCE;
    this.lengthBytes = REEL_ANNOUNCE_PACKET_LENGTH_BYTES;
    this.identifier = content.identifier;
    this.deviceCount = content.deviceCount;
    this.nonce = content.nonce;
  }

  // Constructor for ReelceiverStatistics
  else if((type = TYPE_REELCEIVER_STATISTICS) && isContent) {
    this.type = TYPE_REELCEIVER_STATISTICS;
    this.lengthBytes = REELCEIVER_STATISTICS_PACKET_LENGTH_BYTES;
    this.reelOffset = content.reelOffset;
    this.identifier = content.identifier;
    this.uptime = content.uptime;
    this.sendCount = content.sendCount;
    this.crcPass = content.crcPass;
    this.crcFail = content.crcFail;
    this.maxRSSI = content.maxRSSI;
    this.avgRSSI = content.avgRSSI;
    this.minRSSI = content.minRSSI;
    this.maxLQI = content.maxLQI;
    this.avgLQI = content.avgLQI;
    this.minLQI = content.minLQI;
    this.temperature = content.temperature;
    this.radioVoltage = content.radioVoltage;
    this.serialVoltage = content.serialVoltage;
  }

  // Constructor for Undefined
  else {
    this.type = TYPE_UNDEFINED;
  }

  this.origin = origin;
  this.timestamp = timestamp;
};


/**
 * Return if the given code is a valid DecodedRadioSignal packet.
 * @return {boolean} Validity.
 */
function isDecodedRadioSignalCode(code) {
  return ((code > DECODED_RADIO_SIGNAL_MIN_PACKET_LENGTH_BYTES) &&
          (code <= DECODED_RADIO_SIGNAL_MAX_PACKET_LENGTH_BYTES));
};


/**
 * Return if the given code is a valid ReelAnnounce packet.
 * @return {boolean} Validity.
 */
function isReelAnnounceCode(code) {
  return (code == REEL_ANNOUNCE_REEL_PACKET_CODE);
};


/**
 * Return if the given code is a valid ReelAnnounce packet.
 * @return {boolean} Validity.
 */
function isReelceiverStatisticsCode(code) {
  return (code == REELCEIVER_STATISTICS_REEL_PACKET_CODE);
};


module.exports = ReelPacket;
module.exports.isDecodedRadioSignalCode = isDecodedRadioSignalCode;
module.exports.isReelAnnounceCode = isReelAnnounceCode;
module.exports.isReelceiverStatisticsCode = isReelceiverStatisticsCode;
module.exports.PREFIX = PREFIX;
module.exports.DECODED_RADIO_SIGNAL = TYPE_DECODED_RADIO_SIGNAL;
module.exports.REEL_ANNOUNCE = TYPE_REEL_ANNOUNCE;
module.exports.REEL_ANNOUNCE_LENGTH_BYTES = REEL_ANNOUNCE_PACKET_LENGTH_BYTES;
module.exports.REELCEIVER_STATISTICS = TYPE_REELCEIVER_STATISTICS;
module.exports.REELCEIVER_STATISTICS_LENGTH_BYTES = 
                                    REELCEIVER_STATISTICS_PACKET_LENGTH_BYTES;
