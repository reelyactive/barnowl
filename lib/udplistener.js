/**
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */


const dgram = require('dgram');
const EventEmitter = require('events').EventEmitter;
const Raddec = require('raddec');


// Constants
const DEFAULT_PATH = '0.0.0.0:50001';


/**
 * UdpListener Class
 * Listens for raddecs on a UDP port.
 */
class UdpListener extends EventEmitter {

  /**
   * UdpListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    super();
    options = options || {};
    options.path = options.path || DEFAULT_PATH;

    let host = options.path.split(':')[0];
    let port = options.path.split(':')[1];

    this.server = dgram.createSocket('udp4');
    handleServerEvents(this);
    this.server.bind(port, host);
  }
}


/**
 * Handle events from the UDP server.
 * @param {UdpListener} instance The UdpListener instance.
 */
function handleServerEvents(instance) {
  instance.server.on('listening', function() {
    let address = instance.server.address();
    console.log('barnowl: UDP listening on ' + address.address + ':' +
                address.port);
  });

  instance.server.on('message', function(data, remote) {
    try {
      let raddec = new Raddec(data);

      if(raddec !== null) {
        instance.emit('raddec', raddec);
      }
    }
    catch(error) {};
  });

  instance.server.on('error', function(err) {
    instance.server.close();
    console.log('barnowl: UDP error', err);
  });
}


module.exports = UdpListener;
