/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const DEFAULT_ENABLE_MIXING = false;
const DEFAULT_MIXING_DELAY_MILLISECONDS = 1000;
const DEFAULT_MIN_MIXING_DELAY_MILLISECONDS = 5;


/**
 * TemporalMixingQueue Class
 * Mixes.
 */
class TemporalMixingQueue {

  /**
   * TemporalMixingQueue constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(next, options) {
    options = options || {};

    this.items = {};
    this.next = next;
    this.enableMixing = options.enableMixing || DEFAULT_ENABLE_MIXING;
    this.mixingDelayMilliseconds = options.mixingDelayMilliseconds ||
                                   DEFAULT_MIXING_DELAY_MILLISECONDS;
    this.minMixingDelayMilliseconds = options.minMixingDelayMilliseconds ||
                                      DEFAULT_MIN_MIXING_DELAY_MILLISECONDS;

    handleTimeouts(this);
  }

  /**
   * Handle the given raddec, adding to the queue if mixing enabled.
   * @param {Object} radioDecoding The given raddec.
   */
  handleRaddec(radioDecoding) {
    if(this.enableMixing) {
      addToQueue(this, radioDecoding);
    }
    else {
      this.next.handleRaddec(radioDecoding);
    }
  }
}


/**
 * Update the queue based on the given packet.
 * @param {Object} instance The given TMQ instance.
 * @param {Object} radioDecoding The given raddec.
 */
function addToQueue(instance, radioDecoding)
{
  let signature = radioDecoding.transmitterId + '-' +
                  radioDecoding.transmitterIdType;
  let isItemPresent = instance.items.hasOwnProperty(signature);

  // The given signature is already present in the queue
  if(isItemPresent) {
    let item = instance.items[signature];
    // TODO: use raddec merge function
    for(index in radioDecoding.packets) {
      let packet = radioDecoding.packets[index];
      let isNewPacket = (item.packets.indexOf(packet) < 0);
      if(isNewPacket) {
        item.packets.push(packet);
      }
    }
    for(index in radioDecoding.rssiSignature) {
      let decoding = radioDecoding.rssiSignature[index];
      item.rssiSignature.push(decoding);
    }
  }

  // The given signature needs to be created in the queue
  else {
    // TODO: observe inherent timestamps
    radioDecoding.timeout = new Date().getTime() +
                            instance.mixingDelayMilliseconds;
    instance.items[signature] = radioDecoding;
  }
}


/**
 * Handle all expired timeouts.  This function sets itself to run again when
 * the next timeout is due to expire, or after the minimum sleep milliseconds,
 * whichever is greater.
 */
function handleTimeouts(instance) {
  let currentTime = new Date().getTime();
  let nextTimeout = currentTime + instance.mixingDelayMilliseconds;

  // Iterate through all items in the queue
  for(signature in instance.items) {
    let item = instance.items[signature];

    // Timeout expired, eject the item
    if(item.timeout <= currentTime) {
      delete instance.items[signature];
      instance.next.handleRaddec(item);
    }

    // Find the next earliest timeout
    else if(item.timeout < nextTimeout) {
      nextTimeout = item.timeout;
    }
  }

  let timeoutMilliseconds = Math.max((nextTimeout - currentTime),
                                     instance.minMixingDelayMilliseconds);
  setTimeout(handleTimeouts, timeoutMilliseconds, instance);
};


module.exports = TemporalMixingQueue;
