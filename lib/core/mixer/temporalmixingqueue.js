/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */
 
var reelib = require('reelib');
var Datastore = require('nedb');
var events = require('events');
var util = require('util');
 
var DEFAULT_DELAY = 200;
var DEFAULT_SIGNATURES_SPECIFIC_DELAY = true;
 
 
/**
 * TemporalMixingQueue Class
 * Groups, based on time, objects which share a common string.
 * @param {Object} options The options as a JSON object.
 * @constructor
 * @extends {events.EventEmitter}
 */
function TemporalMixingQueue(options) {
  var self = this;
  var options = options || {};
 
  self.delayms = options.mixingDelayMilliseconds || DEFAULT_DELAY;
 
  if(options.signatureSpecificDelay) {
    self.signatureSpecificDelay = options.signatureSpecificDelay;
  }
  else {
    self.signatureSpecificDelay = DEFAULT_SIGNATURES_SPECIFIC_DELAY;
  }
 
  self.binded = false;
  self.emitters = [];
  self.signatures = []; // A Queue of pairs signature-timeout
  self.db = new Datastore();
 
  events.EventEmitter.call(self);
}
util.inherits(TemporalMixingQueue, events.EventEmitter);
 
 
/**
 * Keep passing itself in callback so it is kept alive. 
 * At each signature, it asks itself whether it should sleep or consume the queue.
 */
TemporalMixingQueue.prototype.handleTemporalMixingQueue = function() {
  var self = this;
  var sleepTime = timeToSleep(self);
  
  if(sleepTime) {
    sleepAndResume(self,sleepTime);
  }
  else {
    self.consumeQueue(self.handleTemporalMixingQueue);
  }
}
 
 
/**
 * Push the packetArray corresponding to the signature.
 * Dequeue the first signature.
 * Nothing of the packetArray nor the signature is left once done.
 */
TemporalMixingQueue.prototype.consumeQueue = function() {
  var self = this;
  var signatureValue = self.signatures[0].value;
 
  getPackets(self, signatureValue, function(signatureValue, self, packetArray) {
    var cleanedPacketArray = cleanAndMergePackets(packetArray);
    self.emit('decodedRadioSignalPacketArray', cleanedPacketArray);
    deletePackets(self, signatureValue, function(self, signatureValue) {
      self.signatures.shift();
      self.handleTemporalMixingQueue();
    });
  }); 
}
 
 
/**
 * Insert a packet in the database. 
 * Enqueue the signature if needed.
 * @param {packet} packet to be inserted into the database.
 */
TemporalMixingQueue.prototype.produceQueue = function(packet) {
  var self = this;
  var signatureValue = packet.identifier.value;
  var signatureAlreayPresent = isSignaturePresent(self,signatureValue);
 
    if(signatureAlreayPresent) {
      self.db.insert(packet);
    }
    else {
      addSignature(self,signatureValue);
      self.db.insert(packet);
    }
}
 
 
/**
 * Bind the temporal mixing queue to an event emitter.
 * @param {ListenerService} emitter ListenerService.
 */
TemporalMixingQueue.prototype.bind = function(emitter) {
  var self = this;
  
  self.emitters.push(emitter);
 
  emitter.on('decodedRadioSignalPacket', function(packet) {
      self.produceQueue(packet);
  });
 
  if(self.binded === false) {
    self.handleTemporalMixingQueue(); 
    self.binded = true;
  } 
}
 
 
/**
 * Return the amount of time the consumer needs to sleep.
 * @param {instance} instance of a temporal mixing queue.
 * @return {Number} milliseconds.
 */
function timeToSleep (instance) {
  var timeToSleep = 0;
 
  if(instance.signatures[0]) {
    if(instance.signatureSpecificDelay) {
      return Math.max(0, instance.signatures[0].timeOut - reelib.time.getCurrent());
    }
    else {
      return 0;
    }
  }
  else {
    return instance.delayms;
  }
}
 
 
/**
 * Short function meant to help readibility.
 * @param {instance} instance of temporal mixing queue.
 * @param {sleepTime} the amount of time to sleep.
 */
function sleepAndResume (instance, sleepTime) {
  setTimeout(instance.handleTemporalMixingQueue.bind(instance), sleepTime);
}
 
 
/**
 * Construct and enqueue a signature.
 * @param {instance} instance of temporal mixing queue.
 * @param {signatureValue} the signature to enqueue. 
 */
function addSignature (instance, signatureValue) {
  var signatureTimeOut = reelib.time.getFuture(instance.delayms);
  instance.signatures.push({'value' : signatureValue, 'timeOut' : signatureTimeOut});
}
 
/**
 * Check if there is a signature with the corresponding value.
 * @param {instance} instance of temporal mixing queue.
 * @param {signatureValue} the signature to enqueue.
 * @return {Boolean} if the given signature is present.
 */
function isSignaturePresent (instance, signatureValue) {
  for(var i = 0; i < instance.signatures.length; i++) {
    if(instance.signatures[i].value === signatureValue) {
      return true;
    }
  }
  return false;
}
 
 
/**
 * Retrieve the packets with corresponding signature.
 * @param {instance} instance of temporal mixing queue.
 * @param {signatureValue} the signature to enqueue. 
 * @param {callback} callback Function to call upon completion.
 */
function getPackets(instance, signatureValue, callback) {
  instance.db.find({'identifier.value' : signatureValue}, function (err, packetArray) {
    callback(signatureValue, instance, packetArray);
  });
}
 
 
/**
 * Removed the _id property that nedb added to our packets.
 * @param {packetArray} the array of packets to clean.
 */
function cleanPackets(packetArray) {
  for(var i = 0; i < packetArray.length; i++) {
    delete packetArray[i]._id;
  }
}
 
 
/**
 * Delete the packets with corresponding signature.
 * @param {instance} instance of temporal mixing queue.
 * @param {signatureValue} deleting packets with this signature.
 * @param {callback} callback Function to call upon completion.
 */
function deletePackets(instance, signatureValue, callback) {
  instance.db.remove({'identifier.value' : signatureValue},{multi: true}, function () {
    callback(instance, signatureValue);
  });
}
 
 
/**
 * Update the signature by refreshing its timeout and moving it to the back of the queue.
 * @param {instance} instance of temporal mixing queue.
 * @param {signatureValue} signature to be updated.
 */
function updateSignature(instance, signatureValue) {
  instance.signatures.splice(instance.signatures.indexOf(signatureValue),1); // Delete the signature
  var signatureTimeOut = reelib.time.getFuture(instance.delayms);
  instance.signatures.push({'value' : signatureValue, 'timeOut' : signatureTimeOut});
}
 
 
 
/**
 * Combine packets with the same origins.
 * @param {packetArray} coming directly from the database.
 * @return {Array} of cleaned and merged packets.
 */
function cleanAndMergePackets(packetArray) {
 
 
  cleanPackets(packetArray); // Removing the _id that nedb added.
 
  var origins = []; 
  var aggregatedRadioDecodings = [];
  var cleanedPacketArray = [];
 
  for(var i = 0; i < packetArray.length; i++) { // Getting a list of origins
      origins.push(packetArray[i].origin);
  }
 
  var uniqueOrigins = removeDuplicate(origins); // Removing duplicates
 
  // Getting one packet for each origin
  for(var i = 0; i < uniqueOrigins.length; i++) {
    for(var j = 0; j < packetArray.length; j++) {
      if(uniqueOrigins[i] === packetArray[j].origin) {
        cleanedPacketArray.push(packetArray[j]);
        break;
      }
    }
  }
 
 // For each origin, merge packets with given origin.
 for(var i = 0; i < cleanedPacketArray.length; i++) {
  var origin = cleanedPacketArray[i].origin;
  var aggregatedRadioDecodings = gatherRadioDecodings(origin, packetArray);
  cleanedPacketArray[i].radioDecodings = []; //Resetting the radioDecodings.
 
  for(var j = 0; j < aggregatedRadioDecodings.length; j++) {
    var arrayOfrssi = aggregatedRadioDecodings[j].rssi;
    var rssi = rssiMerge(arrayOfrssi);
    var reelOffset = aggregatedRadioDecodings[j].reelOffset;
    var toBePushed = {'reelOffset' : reelOffset, 'rssi' : rssi};
    cleanedPacketArray[i].radioDecodings.push(toBePushed); //Adding the updated radioDecodings
  }
 
 }
 
  return cleanedPacketArray;
}
 
 
/**
 * Restructuring and returing the radioDecodings in an arrray of bins labelled by offsets.
 * @param {origin} only collecting packets coming from the given origin.
 * @param {packetArray} packetArray to collect packets from.
 * @return {Array} of the following form : 
 * [ { reelOffset : offset, rssi : [rssi_1, ..., rssi_n] }, { ... }, ... ]
 */
function gatherRadioDecodings(origin, packetArray) {
 
  var radioDecodingsArray = [];
  var reelOffsetArray = [];
  var aggregatedRadioDecodings = [];
 
  for(var i = 0; i < packetArray.length; i++) {
    if(packetArray[i].origin === origin) {
      for(var j = 0; j < packetArray[i].radioDecodings.length; j++) { 
        radioDecodingsArray.push(packetArray[i].radioDecodings[j]);
      }
    }
  }
 
  for(var i = 0; i < radioDecodingsArray.length; i++) {
    reelOffsetArray.push(radioDecodingsArray[i].reelOffset);
  }
 
  var uniqueReelOffsetArray = removeDuplicate(reelOffsetArray);
 
  // Refactoring the radioDecodings. We begin by creating a list of empty radioDecodings.
  for(var i = 0; i < uniqueReelOffsetArray.length; i++) {
    aggregatedRadioDecodings.push({'reelOffset' : uniqueReelOffsetArray[i], 'rssi' : [] });
  }
 
  // For each radioDecodings, dispatch the rssi in the right bin.
  for(var i = 0; i < radioDecodingsArray.length; i++) {
    var reelOffset = radioDecodingsArray[i].reelOffset;
    var rssi = radioDecodingsArray[i].rssi;
 
    var index = uniqueReelOffsetArray.indexOf(reelOffset); //Finding the right bin.
    aggregatedRadioDecodings[index].rssi.push(rssi); // Pushing the rssi in the right bin.
  }
  
  return aggregatedRadioDecodings; // [ { reelOffset , [ rssi, rssi, ...] } , {...}, ... ]
}
 
 
/**
 * Takes an array of rssi, combine them into a single rssi and returns it.
 * @param {array} array of rssi 
 * @return {Number} the result of the merging.
 */
function rssiMerge(array) {
 
  var sum = 0;
  var dividor = array.length;
 
  for(var i = 0; i < array.length; i++) {
    if(array[i] !== 42) { // TODO: Remove the lines handling 42 when everything has been fixed.
      sum = sum + array[i];
    }
    else {
      dividor--;
    }
  }
  if(dividor !== 0) {
    return Math.ceil(sum/dividor);
  }
  else {
    return 42;
  }
}
 
 
/**
 * Returns an array free of duplicates.
 * @param {array} array to remove duplicates.
 * @return {array} free of duplicates.
 */
function removeDuplicate(array) {
 
  return array.filter(function(elem, pos) {
    return array.indexOf(elem) == pos;
  });
}
 
 
module.exports = TemporalMixingQueue

