/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var dgram = require('dgram');
var util = require('util');
var events = require('events');
var time = require('../../common/util/time');


// Constants
var PROTOCOL = 'udp';


/**
 * UdpListener Class
 * Listens for data on a UDP port and emits this data
 * @param {string} path Path to UDP host and port, ex: 192.168.1.1:50000.
 * @constructor
 * @extends {events.EventEmitter}
 */
function UdpListener(path) {
  var self = this;
  var pathElements = path.split(':');
  var host = pathElements[0];
  var port = pathElements[1];
  var server = dgram.createSocket('udp4');

  events.EventEmitter.call(this);
  server.bind(port, host);

  server.on('listening', function () {
    var address = server.address();
    console.warn('UDP Listening on ' + address.address + ':' + address.port);
  });
  server.on('message', function (data, remote) {
    var origin = remote.address + ':' + remote.port;
    var timestamp = time.getCurrent();
    self.emit('data', data, origin, timestamp);
  });
  server.on('error', function (err) {
    console.log(err);
    server.close();
  });

};
util.inherits(UdpListener, events.EventEmitter);


module.exports = UdpListener;
module.exports.PROTOCOL = PROTOCOL;
