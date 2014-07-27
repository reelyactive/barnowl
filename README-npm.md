barnowl
=======


What's in a name?
-----------------

barnowl listens for [reelyActive radio sensor reel packets](http://context.reelyactive.com/technology.html), processes the data stream and emits detected events.  In other words, it is a middleware package that identifies and locates all the advertising wireless devices within a [Smart Space](http://context.reelyactive.com).  Why the name?  The Barn Owl has the best hearing of any animal tested.


Prerequisite hardware
---------------------

barnowl requires a source of reelyActive sensor reel packets.  These originate from a reel of reelceivers.  The packet stream may arrive via a local serial connection or encapsulated in UDP packets from a remote source.  reelyActive hardware can be purchased via our [online store](http://shop.reelyactive.com).

__Important: Version 0.3.0 breaks compatibility with hardware produced before May 2014. Version 0.2.3 will continue to serve this previous generation hardware.  Contact us to clarify your situation, if necessary.  Thanks!__

barnowl runs happily on embedded computers such as the BeagleBone Black, as well as your local machine, as well as in the cloud.  And it installs in just one line via npm:

    npm install barnowl


Less talk, more action!
-----------------------

Get started in minutes with [barnowl-test](https://github.com/reelyactive/barnowl-test).  Follow the instructions and in four lines you'll be testing out barnowl!  You won't even need any reelyActive hardware.


Allo Hibou! Show me some code!
------------------------------

With the prerequisite hardware in place, it's just as easy to get started.  The following code is the minimum required to listen to the hardware and output packets to the console:

```javascript
var barnOwl = require("barnowl");
var barnOwlInstance = new barnOwl();

barnOwlInstance.bind('udp', '192.168.1.101:50000'); // See "Where to listen?"

barnOwlInstance.on('visibilityEvent', function(data) {
  var prettyData = JSON.stringify(data, null, " ");
  console.log(prettyData);
});
```

When the above code is run with a valid (and active) serial or UDP data stream as input, you should see JSON output to the console, as below.

    {
      "identifier": {
       "type": "EUI-64",
       "value": "001bc50940100000"
      },
      "timestamp": "2014-01-01T01:23:45.678Z",
      "radioDecodings": [
       {
        "rssi": 123,
        "identifier": {
         "type": "EUI-64",
         "value": "001bc50940800000"
       }
      }
     ]
    }

This JSON represents a visibility event, in other words a device has sent a radio transmission rendering itself visible to all compatible listening devices in range.  There are three elements to a visibility event:

1.  Identifier of the radio transmitter.  reelyActive devices use EUI-64 identifiers.  Bluetooth Smart devices use 48-bit advertiser addresses.
2.  Timestamp of reception of the transmission.  [ISO8601 format](http://en.wikipedia.org/wiki/ISO_8601).
3.  Radio Decodings of the transmission.  This is an array of reelyActive reelceivers which decoded the transmission, ordered by their received signal strength (RSSI).  reelyActive devices use EUI-64 identifiers.


Supported Identifiers
---------------------

__Bluetooth Smart (BLE)__

All Bluetooth Smart (also known as Bluetooth Low Energy) advertising packets are supported, and these use the 48-bit advertiser address as an identifier.  Both the header and data are processed for common fields, however not exhaustively with the current version.

    {
      "identifier": {
        "type": "ADVA-48",
        "value": "123456789abc",
        "advHeader": {
          "type": "ADV_NONCONNECT_IND",
          "length": "30",
          "txAdd": "random",
          "rxAdd": "public"
        },
        "advData": {
          "flags": [Object],
          "completeLocalName": "reelyActive",
          "manufacturerSpecificData": {
            "companyIdentifierCode": "abcd",
            "data": "12345678"
          }
        }
      }
    }

__reelyActive__

All reelyActive devices use a globally unique EUI-64 identifier.

    {
      "identifier": {
        "type": "EUI-64",
        "value": "001bc50940100000",
        "flags": { "transmissionCount": 0 },
        "data": {
          "battery": "3.00V",
          "temperature": "20.5C"
        }
      }
    }


Where to listen?
----------------

__UDP__

Listening for UDP packets requires binding barnowl to an IP address and port on the __local__ machine.  For example if the machine running barnowl has an Ethernet interface with IP address 192.168.1.101, and hardware packets are being sent to that interface on port 50000, then barnowl should listen on that IP address and port as follows:

```javascript
barnOwlInstance.bind('udp', '192.168.1.101:50000');
```

__Serial__

Listening on a serial interface requires the [serialport](https://github.com/voodootikigod/node-serialport) package.  This is NOT included as a dependency since it may not be trivial to install depending on the hardware and operating system.  Ensure that [serialport](https://github.com/voodootikigod/node-serialport) is installed before you bind barnowl to a serial interface!  Specify the serial interface to listen on as follows:

```javascript
barnOwlInstance.bind('serial', '/dev/ttyUSB0');     // Typical on Linux
```

__Events__

Listening to [Node.js Events](http://nodejs.org/api/events.html) requires binding barnowl to an EventEmitter.  Listening to events is a simple means to connect barnowl with alternative data sources.  For instance, you might create an EventEmitter that outputs historical data from a file.  Or you might create an EventEmitter to facilitate integration with hardware like the UART of a [Tessel](https://tessel.io/).

```javascript
barnOwlInstance.bind('event', eventSource);
```

It _is_ possible to bind barnowl to multiple interfaces (UDP, serial, event) simultaneously.


Advanced Parameters
-------------------

__Maximum Strongest Radio Decodings__

It is possible to specify the maximum number of strongest radio decodings to include in visibility events (the default is 1).  This setting could be used for triangulation.  For instance, to set this to 3, instantiate barnowl as follows:

```javascript
var barnOwlInstance = new barnOwl(3);
```

__Mix Multiple Sources__

It is possible to enable a temporal mixing queue which compensates for the case where multiple sources detect the same radio transmission.  For example, if distinct reels are in such proximity that they detect the same devices, this setting should be enabled.  By default this setting is disabled to reduce the memory and computation footprint of barnowl.  To enable the temporal mixing queue, instantiate barnowl as follows:

```javascript
var barnOwlInstance = new barnOwl(1, true);
```

What's next?
------------

This is an active work in progress.  We'll be adding features and making improvements regularly.  Bluetooth Smart is at the top of our list.


License
-------

MIT License

Copyright (c) 2014 reelyActive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
