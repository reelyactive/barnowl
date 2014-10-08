/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var reelPacket = require('./protocols/reelpacket');
var identifier = require('../common/util/identifier');


// Constants
var MIN_PACKET_LENGTH_BYTES = 4;   // TODO: make these take a max
var MAX_PACKET_LENGTH_BYTES = 551; //       from all packet types


/**
 * Convert a chunk of hexadecimal-string buffer into an integer.
 * @param {buffer} buffer The hexadecimal-string buffer to read from.
 * @param {number} start Index of the first byte.
 * @param {number} length Number of bytes to read.
 */
function toInt(buffer, start, length) {
  return parseInt(buffer.substr(start * 2, length * 2), 16);
}


/**
 * Convert a byte of hexadecimal-string buffer from an 8-bit 2's complement
     integer to a value in the range of 0-255.
 * @param {buffer} buffer The hexadecimal-string buffer to read from.
 * @param {number} start Index of the byte.
 */
function toRssi(buffer, start) {
  var unsignedValue = parseInt(buffer.substr(start * 2, 2), 16);
  if(unsignedValue < 128) {
    return (unsignedValue + 128);
  }
  else {
    return (unsignedValue - 128);
  }
}


/**
 * Grab a chunk of hexadecimal-string buffer.
 * @param {buffer} buffer The hexadecimal-string buffer to read from.
 * @param {number} start Index of the first byte.
 * @param {number} length Number of bytes to read.
 */
function toHexString(buffer, start, length) {
  return buffer.substr(start * 2, length * 2);
}


/**
 * Decode a radio signal packet.
 * @param {buffer} buffer The hexadecimal-string buffer to read from.
 * @param {string} origin Origin of the data stream.
 * @param {string} timestamp Timestamp of packet.
 * @return {object} Length of packet in bytes,
 *                  DecodedRadioSignal packet if found.
 */
function decodeRadioSignal(buffer, origin, timestamp) {
  var payloadLengthBytes = toInt(buffer,0,1);
  var reelceiverCount = toInt(buffer,1,1);
  var packetLengthBytes = 2 + payloadLengthBytes + (reelceiverCount * 2);
  var isInvalidReelceiverCount = (reelceiverCount === 0);
  var isTooShort = (buffer.length < (packetLengthBytes * 2));

  if(isInvalidReelceiverCount) {
    var err = new Error('Invalid reelceiver count in Decoded Radio Signal');
    return { err: err, lengthBytes: buffer.length, packet: null };
  }
  else if(isTooShort) {
    var err = new Error('Decoded Radio Signal too short');
    return { err: err, lengthBytes: 0, packet: null };
  }
  else { 
    var decodedRadioSignal = {};
    var payload = toHexString(buffer,2,payloadLengthBytes);
    decodedRadioSignal.identifier = new identifier(identifier.RADIO_PAYLOAD,
                                                   { payload: payload,
                                                     payloadLengthBytes:
                                                       payloadLengthBytes });
    decodedRadioSignal.receiverCount = reelceiverCount;
    decodedRadioSignal.radioDecodings = [ ];
    var reelOffsetStart = 2 + payloadLengthBytes;
    var rssiStart = 3 + payloadLengthBytes;
    var lastReelOffset = -1;
    for(var cDecoding = 0; cDecoding < reelceiverCount; cDecoding++) {
      var decodingOffset = cDecoding * 2; // TODO: outsource bytesPerDecoding
      var reelOffset = toInt(buffer,reelOffsetStart + decodingOffset,1);
      var rssi = toRssi(buffer,rssiStart + decodingOffset);
      var isReelOffsetSequenceError = (reelOffset <= lastReelOffset);
      if(isReelOffsetSequenceError) {
        var err = new Error('Decoded Radio Signal reel offset not \
                             monotonically increasing');
        return { err: err, lengthBytes: buffer.length, packet: null };
      }
      lastReelOffset = reelOffset;
      decodedRadioSignal.radioDecodings.push( { reelOffset: reelOffset,
                                                rssi: rssi } );
    }

    var decodedPacket = new reelPacket(reelPacket.DECODED_RADIO_SIGNAL,
                                       decodedRadioSignal, origin, timestamp);

    return { 
      err: null,
      lengthBytes: packetLengthBytes,
      packet: decodedPacket
    };
  }
}


/**
 * Decode a reel announce packet.
 * @param {buffer} buffer The hexadecimal-string buffer to read from.
 * @param {string} origin Origin of the data stream.
 * @param {string} timestamp Timestamp of packet.
 * @return {object} Length of packet in bytes,
 *                  ReelAnnounce packet if found.
 */
function decodeReelAnnounce(buffer, origin, timestamp) {
  var isTooShort = (buffer.length < (reelPacket.REEL_ANNOUNCE_LENGTH_BYTES*2));

  if(isTooShort) {
    var err = new Error('Reel Announce too short');
    return { err: err, lengthBytes: 0, packet: null };
  }
  else {
    var reelAnnounce = {};
    reelAnnounce.deviceCount = toInt(buffer,1,1);
    reelAnnounce.identifier = new identifier(identifier.RA28,
                                             toHexString(buffer,2,4));
    reelAnnounce.nonce = toHexString(buffer,6,16);
    var decodedPacket = new reelPacket(reelPacket.REEL_ANNOUNCE, reelAnnounce,
                                       origin, timestamp);

    return {
      err: null,
      lengthBytes: decodedPacket.lengthBytes,
      packet: decodedPacket
    };
  }
}


/**
 * Decode a reelceiver statistics packet.
 * @param {buffer} buffer The hexadecimal-string buffer to read from.
 * @param {string} origin Origin of the data stream.
 * @param {string} timestamp Timestamp of packet.
 * @return {object} Length of packet in bytes,
 *                  DecodedRadioSignal packet if found.
 */
function decodeReelceiverStatistics(buffer, origin, timestamp) {
  var isTooShort = (buffer.length < 
                         (reelPacket.REELCEIVER_STATISTICS_LENGTH_BYTES * 2));

  if(isTooShort) {
    var err = new Error('Reelceiver Statistics too short');
    return { err: err, lengthBytes: 0, packet: null };
  }
  else {
    var reelceiverStatistics = {};
    reelceiverStatistics.reelOffset = toInt(buffer,1,1);
    reelceiverStatistics.identifier = new identifier(identifier.RA28,
                                                     toHexString(buffer,2,4));
    reelceiverStatistics.uptime = toInt(buffer,6,2);
    reelceiverStatistics.sendCount = toInt(buffer,8,2);
    reelceiverStatistics.crcPass = toInt(buffer,10,2);
    reelceiverStatistics.crcFail = toInt(buffer,12,2);
    reelceiverStatistics.maxRSSI = toRssi(buffer,14);
    reelceiverStatistics.avgRSSI = toRssi(buffer,15);
    reelceiverStatistics.minRSSI = toRssi(buffer,16);
    reelceiverStatistics.maxLQI = toInt(buffer,17,1);  
    reelceiverStatistics.avgLQI = toInt(buffer,18,1);  
    reelceiverStatistics.minLQI = toInt(buffer,19,1);  
    reelceiverStatistics.temperature = (toInt(buffer,20,1) - 80) / 2;
    reelceiverStatistics.radioVoltage = 1.8 + (toInt(buffer,21,1) / 34);
    reelceiverStatistics.serialVoltage = toInt(buffer,22,1); // TODO: fix
    var decodedPacket = new reelPacket(reelPacket.REELCEIVER_STATISTICS,
                                       reelceiverStatistics, origin,
                                       timestamp);

    return {
      err: null,
      lengthBytes: decodedPacket.lengthBytes,
      packet: decodedPacket
    };
  }
}


/**
 * Decode a reel packet stripped of prefix from a hexadecimal-string buffer.
 * @param {buffer} buffer The hexadecimal-string buffer to read from.
 * @param {streamOrigin} origin Origin of the data stream.
 * @param {string} timestamp Timestamp of packet.
 * @param {integer} indexOfPacket Index of the start of packet in the buffer
 */
function decodeReelPacket(buffer, origin, timestamp, indexOfPacket, callback) {
  var code = parseInt(buffer.substr(indexOfPacket, 2), 16);
  var isTooShort = ((buffer.length - indexOfPacket) < (MIN_PACKET_LENGTH_BYTES * 2));
  var isTooLong = ((buffer.length - indexOfPacket) > (MAX_PACKET_LENGTH_BYTES * 2));
  var isDecodedRadioSignal = reelPacket.isDecodedRadioSignalCode(code);
  var isReelAnnounce = reelPacket.isReelAnnounceCode(code);
  var isReelceiverStatistics = reelPacket.isReelceiverStatisticsCode(code);
  var result;

  if(isTooShort) {
    var err = new Error('Too few bytes in buffer');
    result = { err: err, lengthBytes: 0, packet: null };
  }
  else if(isTooLong) {
    var err = new Error('Too many bytes in buffer');
    result = { err: err, lengthBytes: buffer.length, packet: null };
  }
  else {
    var packetBuffer = buffer.substr(indexOfPacket);
    if(isDecodedRadioSignal) {
      result = decodeRadioSignal(packetBuffer, origin, timestamp);
    }
    else if(isReelAnnounce) {
      result = decodeReelAnnounce(packetBuffer, origin, timestamp);
    }
    else if(isReelceiverStatistics) {
      result = decodeReelceiverStatistics(packetBuffer, origin, timestamp);
    }
    else {
      var err = new Error('Unknown packet type');
      result = { err: err, lengthBytes: buffer.length, packet: null };
    }      
  }
  return result;
}


/**
 * Decode a reel packet from a hexadecimal-string buffer.
 * @param {buffer} buffer The hexadecimal-string buffer to read from.
 * @param {streamOrigin} origin Origin of the data stream. // TODO: update
 * @param {string} timestamp Timestamp of packet.
 * @param {string} prefix Packet prefix.
 * @param {callback} callback Function to call on completion.
 */
function decode(buffer, origin, timestamp, prefix, callback) {
  var indexOfPrefix = buffer[origin].indexOf(prefix);
  var isPrefixAbsent = (indexOfPrefix < 0);

  if(isPrefixAbsent) {
    var err = new Error('Prefix not found in buffer');
    callback(err, buffer, origin, 0, null);
  }
  else {
    var indexOfPacket = indexOfPrefix + prefix.length;
    var result = decodeReelPacket(buffer[origin], origin, timestamp,
                                  indexOfPacket);
    var sliceAt = 0;
    if(result.lengthBytes > 0) {
      sliceAt = indexOfPacket + (result.lengthBytes * 2);
    }
    callback(result.err, buffer, origin, sliceAt, result.packet);
  }
}


module.exports.decode = decode;

