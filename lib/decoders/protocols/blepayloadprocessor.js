/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */


var identifier = require('../../common/util/identifier');


var URI_SERVICE_UUID = "fed8";


/**
 * Process a raw Bluetooth Low Energy radio payload into semantically
 * meaningful information.
 * address.  Note that the payload is LSB first.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {AdvA48} Advertiser address identifier.
 */
function process(payload) {
  var advA48 = toAdvertiserAddress(payload.substr(4,12));
  advA48.advHeader = toAdvertiserHeader(payload.substr(0,4));
  advA48.advData = toAdvertiserData(payload.substr(16));
  return advA48;
}


/**
 * Convert a raw Bluetooth Low Energy advertiser address.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {Object} 48-bit advertiser address.
 */
function toAdvertiserAddress(payload) {
  var advAString = payload.substr(10,2);
  advAString += payload.substr(8,2);
  advAString += payload.substr(6,2);
  advAString += payload.substr(4,2);
  advAString += payload.substr(2,2);
  advAString += payload.substr(0,2);
  return new identifier(identifier.ADVA48, advAString);
}


/**
 * Convert a raw Bluetooth Low Energy advertiser header into its meaningful
 * parts.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {Object} Semantically meaningful advertiser header.
 */
function toAdvertiserHeader(payload) {
  var addressType = parseInt(payload.substr(0,1),16);
  var typeCode = payload.substr(1,1);
  var length = parseInt(payload.substr(2,2),16) % 64;
  var rxAdd = "public";
  var txAdd = "public";
  if(addressType & 0x8) {
    rxAdd = "random";
  }
  if(addressType & 0x4) {
    txAdd = "random";
  }   
  var type;
  switch(typeCode) {
    case("0"):
      type = "ADV_IND";
      break;
    case("1"):
      type = "ADV_DIRECT_IND";
      break;
    case("2"):
      type = "ADV_NONCONNECT_IND";
      break;
    case("3"):
      type = "SCAN_REQ";
      break;
    case("4"):
      type = "SCAN_RSP";
      break;
    case("5"):
      type = "CONNECT_REQ";
      break;
    case("6"):
      type = "ADV_DISCOVER_IND";
      break;
  }
  return { type: type,
           length: length,
           txAdd: txAdd,
           rxAdd: rxAdd
  };
}


/**
 * Convert a raw Bluetooth Low Energy advertiser header into its meaningful
 * parts.
 * https://www.bluetooth.org/en-us/specification/assigned-numbers/generic-access-profile
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @return {Object} Semantically meaningful advertiser header.
 */
function toAdvertiserData(payload) {
  var advertiserDataLength = payload.length;
  var cursor = 0;
  var advertiserData = {};
  while(cursor < advertiserDataLength) {
    var length = (parseInt(payload.substr(cursor,2),16) + 1) * 2;
    var tag = payload.substr(cursor+2,2);
    switch(tag) {
      case("01"):
        parseFlags(payload, cursor, advertiserData);
        break;
      case("02"):
        parseNonComplete16BitUUIDs(payload, cursor, advertiserData);
        break;
      case("03"):
        parseComplete16BitUUIDs(payload, cursor, advertiserData);
        break;
      case("04"):
        parseGenericData(payload, cursor, advertiserData, "nonComplete32BitUUIDs");
        break;
      case("05"):
        parseGenericData(payload, cursor, advertiserData, "complete32BitUUIDs");
        break;
      case("06"):
        parseNonComplete128BitUUIDs(payload, cursor, advertiserData);
        break;
      case("07"):
        parseComplete128BitUUIDs(payload, cursor, advertiserData);
        break;
      case("08"):
        parseShortenedLocalName(payload, cursor, advertiserData);
        break;
      case("09"):
        parseCompleteLocalName(payload, cursor, advertiserData);
        break;
      case("0a"):
        parseTxPower(payload, cursor, advertiserData);
        break;
      case("0d"):
        parseGenericData(payload, cursor, advertiserData, "classOfDevice");
        break;
      case("0e"):
        parseGenericData(payload, cursor, advertiserData, "simplePairingHashC");
        break;
      case("0f"):
        parseGenericData(payload, cursor, advertiserData,
                         "simplePairingRandomizerR");
        break;
      case("10"):
        parseGenericData(payload, cursor, advertiserData,
                         "securityManagerTKValue");
        break;
      case("11"):
        parseGenericData(payload, cursor, advertiserData,
                         "securityManagerOOBFlags");
        break;
      case("12"):
        parseSlaveConnectionIntervalRange(payload, cursor, advertiserData);
        break;
      case("14"):
        parseSolicitation16BitUUIDs(payload, cursor, advertiserData);
        break;
      case("15"):
        parseSolicitation128BitUUIDs(payload, cursor, advertiserData);
        break;
      case("16"):
        parseServiceData(payload, cursor, advertiserData);
        break;
      case("17"):
        parseGenericData(payload, cursor, advertiserData, 
                         "publicTargetAddress");
        break;
      case("18"):
        parseGenericData(payload, cursor, advertiserData, 
                         "randomTargetAddress");
        break;
      case("19"):
        parseGenericData(payload, cursor, advertiserData, "appearance");
        break;
      case("1a"):
        parseGenericData(payload, cursor, advertiserData, 
                         "advertisingInterval");
        break;
      case("1b"):
        parseGenericData(payload, cursor, advertiserData, 
                         "leBluetoothDeviceAddress");
        break;
      case("1c"):
        parseGenericData(payload, cursor, advertiserData, "leRole");
        break;
      case("1d"):
        parseGenericData(payload, cursor, advertiserData, 
                         "simplePairingHashC256");
        break;
      case("1e"):
        parseGenericData(payload, cursor, advertiserData, 
                         "simplePairingRandomizerR256");
        break;
      case("1f"):
        parseGenericData(payload, cursor, advertiserData,
                         "solicitation32BitUUIDs");
        break;
      case("3d"):
        parseGenericData(payload, cursor, advertiserData,
                         "informationData3D");
        break;
      case("ff"):
        parseManufacturerSpecificData(payload, cursor, advertiserData);
        break;
      default:
        //console.log("Unhandled BLE tag " + tag);
    }
    cursor += length;
  }
  return advertiserData;
}


/**
 * Parse BLE advertiser data flags.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseFlags(payload, cursor, advertiserData) {
  var flags = parseInt(payload.substr(cursor+4,2),16);
  var result = [];
  if(flags & 0x01) {
    result.push("LE Limited Discoverable Mode");
  }
  if(flags & 0x02) {
    result.push("LE General Discoverable Mode");
  }
  if(flags & 0x04) {
    result.push("BR/EDR Not Supported");
  }
  if(flags & 0x08) {
    result.push("Simultaneous LE and BR/EDR to Same Device Capable (Controller)");
  }
  if(flags & 0x10) {
    result.push("Simultaneous LE and BR/EDR to Same Device Capable (Host)");
  }
  advertiserData.flags = result;
}


/**
 * Parse BLE advertiser non-complete 16-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseNonComplete16BitUUIDs(payload, cursor, advertiserData) {
  var data = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var nonComplete16BitUUIDs = reverseBytes(data);
  advertiserData.nonComplete16BitUUIDs = nonComplete16BitUUIDs;
}


/**
 * Parse BLE advertiser complete 16-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseComplete16BitUUIDs(payload, cursor, advertiserData) {
  var data = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var complete16BitUUIDs = reverseBytes(data);
  advertiserData.complete16BitUUIDs = complete16BitUUIDs;
}


/**
 * Parse BLE advertiser non-complete 128-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseNonComplete128BitUUIDs(payload, cursor, advertiserData) {
  var data = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var nonComplete128BitUUIDs = reverseBytes(data); 
  advertiserData.nonComplete128BitUUIDs = nonComplete128BitUUIDs;
}


/**
 * Parse BLE advertiser complete 128-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseComplete128BitUUIDs(payload, cursor, advertiserData) {
  var data = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var complete128BitUUIDs = reverseBytes(data);
  advertiserData.complete128BitUUIDs = complete128BitUUIDs;
}


/**
 * Parse BLE advertiser data non-complete shortened local name.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseShortenedLocalName(payload, cursor, advertiserData) {
  var hexName = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var result = "";
  for(var cChar = 0; cChar < hexName.length; cChar += 2) {
    result += String.fromCharCode(parseInt(hexName.substr(cChar,2),16));
  }
  advertiserData.shortenedLocalName = result;
}


/**
 * Parse BLE advertiser data complete local name.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseCompleteLocalName(payload, cursor, advertiserData) {
  var hexName = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var result = "";
  for(var cChar = 0; cChar < hexName.length; cChar += 2) {
    result += String.fromCharCode(parseInt(hexName.substr(cChar,2),16));
  }
  advertiserData.completeLocalName = result;
}


/**
 * Parse BLE advertiser TX power.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseTxPower(payload, cursor, advertiserData) {
  advertiserData.txPower = convertTxPower(payload.substr(cursor+4,2));
}


/**
 * Parse BLE advertiser data slave connection interval range.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseSlaveConnectionIntervalRange(payload, cursor, advertiserData) {
  var result = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData.slaveConnectionIntervalRange = result;
}


/**
 * Parse BLE advertiser data service solicitation 16-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseSolicitation16BitUUIDs(payload, cursor, advertiserData) {
  var data = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var solicitation16BitUUIDs = reverseBytes(data);
  advertiserData.solicitation16BitUUIDs = solicitation16BitUUIDs;
}


/**
 * Parse BLE advertiser data service solicitation 128-bit UUIDs.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseSolicitation128BitUUIDs(payload, cursor, advertiserData) {
  var data = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var solicitation128BitUUIDs = reverseBytes(data);
  advertiserData.solicitation128BitUUIDs = solicitation128BitUUIDs;
}


/**
 * Parse BLE advertiser data service data.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseServiceData(payload, cursor, advertiserData) {
  var serviceData = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  var uuid = serviceData.substr(2,2) + serviceData.substr(0,2);
  var data = serviceData.substr(4);
  advertiserData.serviceData = { uuid: uuid, data: data };
  if(uuid === URI_SERVICE_UUID) {
    var uriBeacon = parseUriServiceData(data);
    advertiserData.serviceData.uriBeacon = uriBeacon;
  }
}


/**
 * Parse generic data.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseGenericData(payload, cursor, advertiserData, adType) {
  var genericData = payload.substr(cursor+4, getTagDataLength(payload, cursor));
  advertiserData[adType] = genericData;
}


/**
 * Parse BLE advertiser data manufacturer specific data.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 * @param {Object} advertiserData The object containing all parsed data.
 */
function parseManufacturerSpecificData(payload, cursor, advertiserData) {
  var companyIdentifierCode = payload.substr(cursor+6, 2);
  companyIdentifierCode += payload.substr(cursor+4, 2);
  var data = payload.substr(cursor+8, getTagDataLength(payload, cursor)-4);
  advertiserData.manufacturerSpecificData = {
                                 companyIdentifierCode: companyIdentifierCode,
                                 data: data };
  var isApple = (companyIdentifierCode === "004c");
  var isIBeacon = (data.substr(0,4) === "0215");
  if(isApple && isIBeacon) {
    var iBeacon = {};
    iBeacon.uuid = data.substr(4,32);
    iBeacon.major = data.substr(36,4);
    iBeacon.minor = data.substr(40,4);
    iBeacon.txPower = convertTxPower(data.substr(44,2));
    advertiserData.manufacturerSpecificData.iBeacon = iBeacon; 
  }
}


/**
 * Parse Uri Service data (from Google's Physical Web).
 * https://github.com/google/uribeacon/blob/master/specification/AdvertisingMode.md
 * @param {string} data The raw UriBeacon data as a hexadecimal-string.
 * @return {Object} The decoded Uri
 */
function parseUriServiceData(data) {
  var uriBeacon = {};
  var flags = parseInt(data.substr(0,2),16);
  uriBeacon.invisibleHint = false;
  if(flags & 0x01) {
    uriBeacon.invisibleHint = true;
  }
  var rawTxPower = data.substr(2,2);
  uriBeacon.txPower = convertTxPower(rawTxPower);
  var schemePrefix = parseInt(data.substr(4,2),16);
  switch(schemePrefix) {
    case 0x00:
      uriBeacon.url = "http://www.";
      break;
    case 0x01:
      uriBeacon.url = "https://www.";
      break;
    case 0x02:
      uriBeacon.url = "http://";
      break;
    case 0x03:
      uriBeacon.url = "https://";
      break;
    case 0x03:
      uriBeacon.urnuuid = "urn:uuid:";
      break;
    default:
      break;
  }
  var encodedUri = data.substr(6);
  var uriString = "";
  for(var cChar = 0; cChar < (encodedUri.length / 2); cChar++) {
    var charCode = parseInt(encodedUri.substr(cChar*2,2),16);
    switch(charCode) {
      case 0x00:
        uriString += ".com/";
        break;
      case 0x01:
        uriString += ".org/";
        break;
      case 0x02:
        uriString += ".edu/";
        break;
      case 0x03:
        uriString += ".net/";
        break;
      case 0x04:
        uriString += ".info/";
        break;
      case 0x05:
        uriString += ".biz/";
        break;
      case 0x06:
        uriString += ".gov/";
        break;
      case 0x07:
        uriString += ".com";
        break;
      case 0x08:
        uriString += ".org";
        break;
      case 0x09:
        uriString += ".edu";
        break;
      case 0x0a:
        uriString += ".net";
        break;
      case 0x0b:
        uriString += ".info";
        break;
      case 0x0c:
        uriString += ".biz";
        break;
      case 0x0d:
        uriString += ".gov";
        break;
      default:
        uriString += String.fromCharCode(charCode);
    }
  }
  if(uriBeacon.url) {
    uriBeacon.url += uriString;
  }
  else if(uri.urnuuid) {
    uriBeacon.urnuuid += uriString;
  }
  return uriBeacon;
}


/**
 * Calculate the length of the data (flag excluded) of a BLE tag.
 * @param {string} payload The raw payload as a hexadecimal-string.
 * @param {number} cursor The start index within the payload.
 */
function getTagDataLength(payload, cursor) {
  return (parseInt(payload.substr(cursor,2),16) - 1) * 2;
}


/**
 * Convert raw txPower to dBm.
 * @param {string} rawTxPower The raw txPower as a hexadecimal-string.
 */
function convertTxPower(rawTxPower) {
  var txPower = parseInt(rawTxPower,16);
  if(txPower > 127) {
    txPower -= 256;
  }
  return txPower + "dBm";
}


/**
 * Reverse the order of the bytes in the data.
 * @param {string} data The data as a hexadecimal-string.
 */
function reverseBytes(data) {
  var result = "";
  for(var cChar = (data.length - 2); cChar >= 0; cChar -= 2) {
    result += data.substr(cChar,2);
  }
  return result;
}

module.exports.process = process;
