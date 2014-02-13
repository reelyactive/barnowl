/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var time = require('../../common/util/time');


// Constants
var PROTOCOL = 'serial';
var BAUDRATE = 230400;


/**
 * SerialListener Class
 * Listens for data on a serial port and emits this data
 * @param {string} path Path to serial port, ex: /dev/ttyUSB0.
 * @constructor
 * @extends {events.EventEmitter}
 */
function SerialListener(path) {
  var self = this;
  var path = path;
  var SerialPort = require('serialport').SerialPort
  var serialPort = new SerialPort(path, {
    baudrate: BAUDRATE
  });

  events.EventEmitter.call(this);

  // Serial Port must be open before reading data
  serialPort.on('open', function () {
    serialPort.on('data', function(data) {
      var timestamp = time.getCurrent();
      self.emit('data', data, path, timestamp);
    });
    serialPort.on('close', function(data) {
      console.log("Serial port closed");
    });
  });
};
util.inherits(SerialListener, events.EventEmitter);


module.exports = SerialListener;
module.exports.PROTOCOL = PROTOCOL;
