/**
 * Copyright reelyActive 2014-2026
 * We believe in an open Internet of Things
 */


import TemporalMixingQueue from "./temporalmixingqueue.js";


const DEFAULT_METRICS_UPDATE_MILLISECONDS = 5000;


/**
 * Barnowl Class
 * Converts protocol-specific radio decodings into standard raddec events.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
class Barnowl extends EventTarget {

  /**
   * Barnowl constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options = {}) {
    super();

    this.metricsUpdateMilliseconds = options.metricsUpdateMilliseconds ||
                                     DEFAULT_METRICS_UPDATE_MILLISECONDS;
    this.metrics = {};
    this.liveStats = { numberOfDispatchedEvents: 0 };
    this.interfaces = new Map();
    this.controller = new AbortController();
    this.mixer = new TemporalMixingQueue(this, options);

    updateMetrics(this);
    console.log("reelyActive barnowl instance is listening for an open IoT");
  }

  /**
   * Add the given hardware listener, instantiating the interface if required.
   * @param {class} interfaceClass - The (uninstantiated) barnowl-x interface.
   * @param {object} interfaceOptions - The interface options as a JSON object.
   * @param {class} listenerClass - The (uninstantiated) listener class.
   * @param {object} listenerOptions - The listener options as a JSON object.
   */
  addListener(interfaceClass, interfaceOptions, listenerClass,
              listenerOptions) {
    const interfaceName = `${interfaceClass.name}/${listenerClass.name}`;
    let listener = null;

    if(interfaceClass.name === "Barnowl") {
      listener = new listenerClass(listenerOptions);
    }
    else {
      listener = prepareInterface(this, interfaceClass, interfaceOptions,
                                  listenerClass, listenerOptions);
    }

    this.interfaces.set(interfaceName, listener);
    this.handleMessageStream(listener);
  }

  /**
   * Handle the message stream from the given barnowl-x listener.
   * @param {object} listener - The instantiated listener.
   */
  async handleMessageStream(listener) {
    const { signal } = this.controller;

    try {
      // Asynchronously iterate over ReadableStream of messages
      for await(const message of listener.observeMessageStream(signal)) {

        // Radio decodings (raddecs) get mixed
        if(message.type === "raddec") {
          this.mixer.handleRaddec(message.detail);
        }

        // All other messages are simply dispatched (emitted)
        else {
          this.dispatchEvent(new CustomEvent(message.type,
                                             { detail: message.detail }));
          this.liveStats.numberOfDispatchedEvents++;
        }
      }
    }
    catch(error) {
      console.error(`barnowl: listener message stream error ${error}`);
    }
  }

  /**
   * Handle and emit the given raddec.
   * @param {Raddec} raddec - The given Raddec instance.
   */
  handleRaddec(raddec) {
    raddec.trim();
    this.dispatchEvent(new CustomEvent("raddec", { detail: raddec }));
    this.liveStats.numberOfDispatchedEvents++;
  }

  /**
   * Provide the latest compiled metrics.
   * @returns {object} - Metrics for this instance and its interfaces.
   */
  getMetrics() {
    const interfaceMetrics = Object.fromEntries(Array.from(this.interfaces,
                      ([ name, instance ]) => [ name, instance.getMetrics() ]));
    const mixerMetrics = { TemporalMixingQueue: this.mixer.getMetrics() };

    return { ...this.metrics, ...interfaceMetrics, ...mixerMetrics };
  }
}


/**
 * Prepare the given hardware interface, instantiating it if required, and
 * adding the given listener.
 * @param {Barnowl} instance - The Barnowl instance.
 * @param {class} interfaceClass - The (uninstantiated?) barnowl-x interface.
 * @param {object} interfaceOptions - The interface options as a JSON object.
 * @param {class} listenerClass - The (uninstantiated?) listener class.
 * @param {object} listenerOptions - The listener options as a JSON object.
 * @returns {object} - The interface instance.
 */
function prepareInterface(instance, interfaceClass, interfaceOptions,
                          listenerClass, listenerOptions) {
  instance.interfaces.forEach((interfaceInstance) => {
    const isInstantiated = (interfaceInstance instanceof interfaceClass);

    // Interface already instantiated
    if(isInstantiated) {
      interfaceInstance.addListener(listenerClass, listenerOptions);
      return interfaceInstance;
    }
  });

  // Interface needs to be instantiated
  const interfaceInstance = new interfaceClass(interfaceOptions);
  interfaceInstance.addListener(listenerClass, listenerOptions);
  instance.interfaces.push(interfaceInstance);
  return interfaceInstance;     
}


/**
 * Update the metrics for this Barnowl instance.
 * @param {Barnowl} instance - The Barnowl instance.
 * @param {object} instance.metrics - The metrics.
 * @param {object} instance.liveStats - The live stats.
 * @param {number} instance.metricsUpdateMilliseconds - The timeout to repeat.
 * @param {number} instance.lastMetricsUpdateTimestamp - The previous timestamp.
 */
function updateMetrics({ metrics, liveStats, metricsUpdateMilliseconds,
                         lastMetricsUpdateTimestamp }) {
  const isInitialUpdate = !Number.isFinite(lastMetricsUpdateTimestamp);

  if(!isInitialUpdate) {
    const intervalSeconds = (Date.now() - lastMetricsUpdateTimestamp) / 1000;
    metrics.eventsDispatchedPerSecond = liveStats.numberOfDispatchedEvents /
                                        intervalSeconds;
    liveStats.numberOfDispatchedEvents = 0;

    metrics.timestamp = Date.now();
  }

  lastMetricsUpdateTimestamp = Date.now();
  setTimeout(updateMetrics, metricsUpdateMilliseconds, { metrics, liveStats,
             metricsUpdateMilliseconds, lastMetricsUpdateTimestamp });
}


export { default as TestListener } from "./testlistener.js";
export { default as UdpListener } from "./udplistener.js";
export default Barnowl;
