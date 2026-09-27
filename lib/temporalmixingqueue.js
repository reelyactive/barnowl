/**
 * Copyright reelyActive 2014-2026
 * We believe in an open Internet of Things
 */


const DEFAULT_ENABLE_MIXING = false;
const DEFAULT_MIXING_DELAY_MILLISECONDS = 1000;
const DEFAULT_MIN_MIXING_DELAY_MILLISECONDS = 20;
const DEFAULT_ACCEPT_FUTURE_RADDECS = true;


/**
 * TemporalMixingQueue Class
 * Mixes raddecs (and perhaps in future other types) within a fixed time window.
 */
class TemporalMixingQueue {

  /**
   * TemporalMixingQueue constructor
   * @param {Barnowl} barnowl - The barnowl instance.
   * @param {object} options - The options as a JSON object.
   * @constructor
   */
  constructor(barnowl, options = {}) {
    this.raddecs = new Map();
    this.barnowl = barnowl;
    this.metrics = {};
    this.metricsUpdateMilliseconds = barnowl.metricsUpdateMilliseconds;
    this.liveStats = { numberOfInsertedRaddecs: 0,
                       numberOfMergedRaddecs: 0 };

    this.enableMixing = options.enableMixing || DEFAULT_ENABLE_MIXING;
    this.mixingDelayMilliseconds = options.mixingDelayMilliseconds ||
                                   DEFAULT_MIXING_DELAY_MILLISECONDS;
    this.minMixingDelayMilliseconds = options.minMixingDelayMilliseconds ||
                                      DEFAULT_MIN_MIXING_DELAY_MILLISECONDS;
    this.acceptFutureRaddecs = options.acceptFutureRaddecs ||
                               DEFAULT_ACCEPT_FUTURE_RADDECS;

    if(this.enableMixing) {
      handleTimeouts(this);
    }

    updateMetrics(this);
  }

  /**
   * Handle the given raddec, adding to the queue if mixing enabled.
   * @param {Raddec} raddec - The given Raddec instance.
   */
  handleRaddec(raddec) {
    const isFuture = (raddec.initialTime > Date.now());

    if(isFuture) {
      if(this.acceptFutureRaddecs) {
        raddec.timestamp = Date.now();
      }
      else {
        return;
      }
    }

    if(this.enableMixing) {
      addToQueue(raddec, this);
    }
    else {
      this.barnowl.handleRaddec(raddec);
    }
  }

  /**
   * Provide the latest compiled metrics.
   * @returns {object} - Metrics for the queue.
   */
  getMetrics() {
    return { ...this.metrics, ...{ raddecQueueSize: this.raddecs.size } };
  }

}


/**
 * Update the queue based on the given Raddec instance.
 * @param {Raddec} raddec - The given Raddec instance.
 * @param {TemporalMixingQueue} instance - The TemporalMixingQueue instance.
 * @param {Map} instance.raddecs - The raddec queue.
 * @param {number} instance.mixingDelayMilliseconds - The time to wait in queue.
 * @param {object} instance.liveStats - The live stats to update.
 */
function addToQueue(raddec, { raddecs, mixingDelayMilliseconds, liveStats })
{
  const isPresent = raddecs.has(raddec.signature);

  // The given signature is already present in the queue
  if(isPresent) {
    const target = raddecs.get(raddec.signature);
    target.merge(raddec);
    liveStats.numberOfMergedRaddecs++;
  }

  // The given signature needs to be created in the queue
  else {
    raddec.timeout = raddec.initialTime + mixingDelayMilliseconds;
    raddecs.set(raddec.signature, raddec);
    liveStats.numberOfInsertedRaddecs++;
  }
}


/**
 * Handle all expired timeouts.  This function sets itself to run again when
 * the next timeout is due to expire, or after the minimum sleep milliseconds,
 * whichever is greater.
 * @param {TemporalMixingQueue} instance - The TemporalMixingQueue instance.
 * @param {Map} instance.raddecs - The raddec queue.
 * @param {Barnowl} instance.barnowl - The Barnowl instance.
 * @param {number} instance.mixingDelayMilliseconds - The time to wait in queue.
 * @param {number} instance.minMixingDelayMilliseconds - The minimum timeout.
 */
function handleTimeouts({ raddecs, barnowl, mixingDelayMilliseconds,
                          minMixingDelayMilliseconds }) {
  const currentTime = Date.now();
  let nextTimeout = currentTime + mixingDelayMilliseconds;

  // Iterate through all raddecs in the queue
  raddecs.forEach((raddec, signature) => {

    // Timeout expired, eject the raddec
    if(raddec.timeout <= currentTime) {
      raddecs.delete(signature);
      barnowl.handleRaddec(raddec);
    }

    // Find the next earliest timeout
    else if(raddec.timeout < nextTimeout) {
      nextTimeout = raddec.timeout;
    }
  });

  // Run again at the next timeout, or at least after minMixingDelayMilliseconds
  const timeoutMilliseconds = Math.max((nextTimeout - currentTime),
                                       minMixingDelayMilliseconds);
  setTimeout(handleTimeouts, timeoutMilliseconds, { raddecs, barnowl,
             mixingDelayMilliseconds, minMixingDelayMilliseconds });
};


/**
 * Update the metrics for this TemporalMixingQueue instance.
 * @param {TemporalMixingQueue} instance - The TemporalMixingQueue instance.
 * @param {object} instance.metrics - The metrics.
 * @param {object} instance.liveStats - The live stats.
 * @param {number} instance.metricsUpdateMilliseconds - The timeout to repeat.
 * @param {number} instance.lastMetricsUpdateTimestamp - The previous timestamp.
 */
function updateMetrics({ metrics, liveStats, metricsUpdateMilliseconds,
                         lastMetricsUpdateTimestamp }) {
  const isInitialUpdate = !Number.isFinite(lastMetricsUpdateTimestamp);

  if(!isInitialUpdate) {
    const numberOfHandledRaddecs = liveStats.numberOfInsertedRaddecs +
                                   liveStats.numberOfMergedRaddecs;
    if(numberOfHandledRaddecs > 0) {
      metrics.raddecMergePercentage = Math.round(100 *
                     liveStats.numberOfMergedRaddecs / numberOfHandledRaddecs);
    }
    else {
      metrics.raddecMergePercentage = 0;
    }

    liveStats.numberOfInsertedRaddecs = 0;
    liveStats.numberOfMergedRaddecs = 0;

    metrics.timestamp = Date.now();
  }

  lastMetricsUpdateTimestamp = Date.now();
  setTimeout(updateMetrics, metricsUpdateMilliseconds, { metrics, liveStats,
             metricsUpdateMilliseconds, lastMetricsUpdateTimestamp });
}


export default TemporalMixingQueue;
