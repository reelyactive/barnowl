/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const DEFAULT_ENABLE_MIXING = false;
const DEFAULT_MIXING_DELAY_MILLISECONDS = 1000;
const DEFAULT_MIN_MIXING_DELAY_MILLISECONDS = 5;


/**
 * TemporalMixingQueue Class
 * Mixes raddecs within a fixed time window.
 */
class TemporalMixingQueue {

  /**
   * TemporalMixingQueue constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(next, options) {
    options = options || {};

    this.raddecs = {};
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
   * @param {Raddec} raddec The given Raddec instance.
   */
  handleRaddec(raddec) {
    if(this.enableMixing) {
      addToQueue(this, raddec);
    }
    else {
      this.next.handleRaddec(raddec);
    }
  }
}


/**
 * Update the queue based on the given Raddec instance.
 * @param {TemporalMixingQueue} instance The given TMQ instance.
 * @param {Raddec} raddec The given Raddec instance.
 */
function addToQueue(instance, raddec)
{
  let isPresent = instance.raddecs.hasOwnProperty(raddec.signature);

  // The given signature is already present in the queue
  if(isPresent) {
    let target = instance.raddecs[raddec.signature];
    target.merge(raddec);
  }

  // The given signature needs to be created in the queue
  else {
    // TODO: observe inherent timestamps
    raddec.timeout = new Date().getTime() + instance.mixingDelayMilliseconds;
    instance.raddecs[raddec.signature] = raddec;
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

  // Iterate through all raddecs in the queue
  for(signature in instance.raddecs) {
    let raddec = instance.raddecs[signature];

    // Timeout expired, eject the raddec
    if(raddec.timeout <= currentTime) {
      delete instance.raddecs[signature];
      instance.next.handleRaddec(raddec);
    }

    // Find the next earliest timeout
    else if(raddec.timeout < nextTimeout) {
      nextTimeout = raddec.timeout;
    }
  }

  let timeoutMilliseconds = Math.max((nextTimeout - currentTime),
                                     instance.minMixingDelayMilliseconds);
  setTimeout(handleTimeouts, timeoutMilliseconds, instance);
};


module.exports = TemporalMixingQueue;
