/**
 * Copyright reelyActive 2014-2016
 * We believe in an open Internet of Things
 */


var util = require('util');
var events = require('events');
var time = require('../../common/util/time');


// Constants
var PROTOCOL = 'serial';
var BAUDRATE = 230400;
var AUTO_PATH = 'auto';
var AUTO_MANUFACTURER = 'FTDI';


/**
 * SerialListener Class
 * Listens for data on a serial port and emits this data
 * @param {String} path Path to serial port, ex: /dev/ttyUSB0.
 * @constructor
 * @extends {events.EventEmitter}
 */
function SerialListener(path) {
  var self = this;
  var path = path;

  events.EventEmitter.call(this);

  openSerialPort(path, function(err, serialPort, path) {
    if(err) {
      self.emit('error', err);
      return;
    }
    else {
      serialPort.on('data', function(data) {
        var timestamp = time.getCurrent();
        self.emit('data', data, path, timestamp);
      });
      serialPort.on('close', function(data) {
        self.emit('error', { message: "Serial port closed" } );
      });
      serialPort.on('error', function(err) {
        self.emit('error', err);
      });
    }
  });

}
util.inherits(SerialListener, events.EventEmitter);


/**
 * Open the serial port based on the given path.
 * @param {String} path Path to serial port, ex: /dev/ttyUSB0 or auto.
 * @param {function} callback The function to call on completion.
 */
function openSerialPort(path, callback) {
  var SerialPort = require('serialport');
  var serialPort;
  var options = { baudrate: BAUDRATE, baudRate: BAUDRATE }; // serialport@5

  if(path === AUTO_PATH) {
    var detectedPath;
    SerialPort.list(function(err, ports) {
      if(err) {
        return callback(err);
      }
      for(var cPort = 0; cPort < ports.length; cPort++) {
        var path = ports[cPort].comName;
        var manufacturer = ports[cPort].manufacturer;
        if(manufacturer === AUTO_MANUFACTURER) {
          detectedPath = path;
          serialPort = new SerialPort(path, options, function(err) {
            console.log('Auto serial path: \'' + path + '\' was selected');
            return callback(err, serialPort, detectedPath);
          });
        }
        else if(manufacturer) {
          console.log('Alternate serial path: \'' + path + '\' is a ' +
                      manufacturer + 'device.');
        }
      }
      if(!serialPort) {
        return callback( { message: "Can't auto-determine serial port" } );
      }
    });
  }
  else {
    serialPort = new SerialPort(path, options, function(err) {
      return callback(err, serialPort, path);
    });
  }
}


module.exports = SerialListener;
module.exports.PROTOCOL = PROTOCOL;
