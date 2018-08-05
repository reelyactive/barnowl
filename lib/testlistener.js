/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const EventEmitter = require('events').EventEmitter;
const Raddec = require('raddec');


// Constants
const DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS = 1000;
const DEFAULT_RSSI = -60;
const MIN_RSSI = -100;
const MAX_RSSI = -40;
const RSSI_RANDOM_DELTA = 3;


/**
 * TestListener Class
 * Provides a consistent stream of artificially generated radio decodings.
 */
class TestListener extends EventEmitter {

  /**
   * TestListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    super();
    options = options || {};

    this.radioDecodingPeriod = options.radioDecodingPeriod ||
                               DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS;
    this.rssi = [ DEFAULT_RSSI, DEFAULT_RSSI ];

    setInterval(generateRaddecs, this.radioDecodingPeriod, this);
  }
}


/**
 * Generate raddecs
 * @param {TestListener} instance The TestListener instance.
 */
function generateRaddecs(instance) {
  for(index in instance.rssi) {
    if(instance.rssi[index] > MIN_RSSI) {
      instance.rssi[index] -= Math.round(Math.random() * RSSI_RANDOM_DELTA);
    }
    if(instance.rssi[index] < MAX_RSSI) {
      instance.rssi[index] += Math.round(Math.random() * RSSI_RANDOM_DELTA);
    }
  }
  let raddec = new Raddec({
      transmitterId: "001122334455",
      transmitterIdType: Raddec.identifiers.TYPE_EUI48,
      packets: [ "061b55443322110002010611074449555520657669746341796c656572" ]
  });
  raddec.addDecoding({
      receiverId: "001bc50940810000",
      receiverIdType: Raddec.identifiers.TYPE_EUI64,
      rssi: instance.rssi[0],
      time: new Date().getTime()
  });
  raddec.addDecoding({
      receiverId: "001bc50940810001",
      receiverIdType: Raddec.identifiers.TYPE_EUI64,
      rssi: instance.rssi[1],
      time: new Date().getTime()
  });
  instance.emit("raddec", raddec);
}


module.exports = TestListener;
