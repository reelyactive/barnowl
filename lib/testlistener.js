/**
 * Copyright reelyActive 2014-2026
 * We believe in an open Internet of Things
 */


import Raddec from "raddec";


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
class TestListener {

  /**
   * TestListener constructor
   * @param {Object} options - The options as a JSON object.
   * @constructor
   */
  constructor(options = {}) {
    this.radioDecodingPeriod = options.radioDecodingPeriod ||
                               DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS;
    this.rssi = [ DEFAULT_RSSI, DEFAULT_RSSI ];
    this.metrics = {};
  }

  /**
   * Provide a readable stream of asynchronous messages.
   * @param {AbortSignal} signal - The abort signal.
   * @returns {ReadableStream} - A readable stream of messages.
   */
  observeMessageStream(signal) {
    const rssi = this.rssi;
    const radioDecodingPeriod = this.radioDecodingPeriod;

    return new ReadableStream({
      start(controller) {
        setInterval(() => {
          const message = { type: "raddec", detail: generateRaddec(rssi) };
          controller.enqueue(message)
        }, radioDecodingPeriod);
      },
      cancel() {
        // TODO: cancel interval?
      }
    });
  }

  /**
   * Provide the latest compiled metrics.
   * @returns {object} - Metrics for this listener.
   */
  getMetrics() {
    return { ...this.metrics };
  }

}


/**
 * Generate simulated raddec.
 * @param {array} rssi - The rssi values.
 * @returns {Raddec} - The simulated radio decoding.
 */
function generateRaddec(rssi) {
  updateRssi(rssi);

  const raddec = new Raddec({
      transmitterId: "001122334455",
      transmitterIdType: Raddec.identifiers.TYPE_EUI48,
      packets: [ "061b55443322110002010611074449555520657669746341796c656572" ]
  });
  raddec.addDecoding({
      receiverId: "001bc50940810000",
      receiverIdType: Raddec.identifiers.TYPE_EUI64,
      rssi: rssi[0],
      timestamp: Date.now()
  });
  raddec.addDecoding({
      receiverId: "001bc50940810001",
      receiverIdType: Raddec.identifiers.TYPE_EUI64,
      rssi: rssi[1],
      timestamp: Date.now()
  });

  return raddec;
}


/**
 * Randomly update the rssi values.
 * @param {array} rssi - The rssi values.
 */
function updateRssi(rssi) {
  for(const index in rssi) {
    if(rssi[index] > MIN_RSSI) {
      rssi[index] -= Math.round(Math.random() * RSSI_RANDOM_DELTA);
    }
    if(rssi[index] < MAX_RSSI) {
      rssi[index] += Math.round(Math.random() * RSSI_RANDOM_DELTA);
    }
  }
}


export default TestListener;
