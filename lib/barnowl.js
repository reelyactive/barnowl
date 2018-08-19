/**
 * Copyright reelyActive 2014-2018
 * We believe in an open Internet of Things
 */


const EventEmitter = require('events').EventEmitter;
const TestListener = require('./testlistener');
const TemporalMixingQueue = require('./temporalmixingqueue');


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

    this.interfaces = [];
    this.mixer = new TemporalMixingQueue(this, options);
    console.log('reelyActive barnowl instance is listening for an open IoT');
  }

  /**
   * Add the given hardware listener, instantiating the interface if required.
   * @param {Class} interfaceClass The (uninstantiated) barnowl-x interface.
   * @param {Object} interfaceOptions The interface options as a JSON object.
   * @param {Class} listenerClass The (uninstantiated) listener class.
   * @param {Object} listenerOptions The listener options as a JSON object.
   */
  addListener(interfaceClass, interfaceOptions, listenerClass,
              listenerOptions) {
    let self = this;
    let interfaceInstance = null;

    if(interfaceClass.name === 'Barnowl') {
      interfaceInstance = new listenerClass(listenerOptions);
    }
    else {
      interfaceInstance = prepareInterface(this, interfaceClass,
                                           interfaceOptions, listenerClass,
                                           listenerOptions);
    }

    interfaceInstance.on("raddec", function(raddec) {
      self.mixer.handleRaddec(raddec);
    });
    interfaceInstance.on("infrastructureMessage", function(message) {
      self.emit("infrastructureMessage", message);
    });
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


/**
 * Prepare the given hardware interface, instantiating it if required, and
 * adding the given listener.
 * @param {Barnowl} instance The Barnowl instance.
 * @param {Class} interfaceClass The (uninstantiated) barnowl-x interface.
 * @param {Object} interfaceOptions The interface options as a JSON object.
 * @param {Class} listenerClass The (uninstantiated) listener class.
 * @param {Object} listenerOptions The listener options as a JSON object.
 */
function prepareInterface(instance, interfaceClass, interfaceOptions,
                          listenerClass, listenerOptions) {
  instance.interfaces.forEach(function(interfaceInstance) {
    let isInterfaceInstantiated = (interfaceInstance instanceof interfaceClass);

    // Interface already instantiated
    if(isInterfaceInstantiated) {
      interfaceInstance.addListener(listenerClass, listenerOptions);
      return interfaceInstance;
    }
  });

  // Interface needs to be instantiated
  let interfaceInstance = new interfaceClass(interfaceOptions);
  interfaceInstance.addListener(listenerClass, listenerOptions);
  instance.interfaces.push(interfaceInstance);
  return interfaceInstance;     
}


module.exports = Barnowl;
module.exports.TestListener = TestListener;
