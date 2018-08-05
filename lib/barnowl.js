/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const EventEmitter = require('events').EventEmitter;
const TestListener = require('./testlistener.js');
const TemporalMixingQueue = require('./temporalmixingqueue.js');


/**
 * Barnowl Class
 * Converts protocol-specific radio decodings into standard raddec events.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
class Barnowl extends EventEmitter {

  /**
   * Barnowl constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    super();
    options = options || {};

    this.listeners = [];
    this.mixer = new TemporalMixingQueue(this, options);
    console.log('reelyActive barnowl instance is listening for an open IoT');
  }

  /**
   * Add a listener to the given hardware interface.
   * @param {Class} listenerClass The (uninstantiated) listener class.
   * @param {Object} options The options as a JSON object.
   */
  addListener(listenerClass, options) {
    let self = this;
    let listener;
    let listenerClassName = listenerClass.name;

    switch(listenerClassName) {
      case 'Barnowl':
        listener = new TestListener(options);
        break;
      default:
        throw new Error('Barnowl could not addListener, unrecognised class.');
    }

    listener.on("raddec", function(raddec) {
      self.mixer.handleRaddec(raddec);
    });
    this.listeners.push(listener);
  }

  /**
   * Handle and emit the given raddec.
   * @param {Raddec} raddec The given Raddec instance.
   */
  handleRaddec(raddec) {
    // TODO: observe options to normalise raddec
    this.emit("raddec", raddec);
  }
}


module.exports = Barnowl;
