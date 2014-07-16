/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


/**
 * Return the current time
 * @return {string} Current time in ISO8601 format.
 */
function getCurrent() {
  return new Date().toISOString();
};


/**
 * Return the time which is the given number of milliseconds in the future
 * @return {string} Current time in ISO8601 format.
 */
function getFuture(milliseconds) {
  return toFuture(getCurrent(), milliseconds);
};


/**
 * Return the given time advanced by the given number of milliseconds
 * @return {string} Future time in ISO8601 format.
 */
function toFuture(timestamp, milliseconds) {
  var originalTime = new Date(timestamp);
  var futureTime = originalTime.setMilliseconds(originalTime.getMilliseconds()
                                                + milliseconds);
  return futureTime;
};


/**
 * Return whether the given timestamp is in the past
 * @return {boolean} Is current timestamp in the past?
 */
function isInPast(timestamp) {
  return (new Date() > timestamp);
}


/**
 * Return whether the first given timestamp is earlier than the second
 * @return {boolean} Is it earlier?
 */
function isEarlier(timestamp1, timestamp2) {
  return (timestamp1 < timestamp2);
}


/**
 * Return the number of milliseconds the given timestamp is in the future.
 * @return {number} Number of milliseconds in the future, zero if in the past.
 */
function getFutureMilliseconds(timestamp) {
  if(isInPast(timestamp)) {
    return 0;
  }
  return timestamp - new Date();
}


module.exports.getCurrent = getCurrent;
module.exports.getFuture = getFuture;
module.exports.toFuture = toFuture;
module.exports.isInPast = isInPast;
module.exports.isEarlier = isEarlier;
module.exports.getFutureMilliseconds = getFutureMilliseconds;
