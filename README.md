barnowl
=======


Middleware for low-power wireless radio infrastructure
------------------------------------------------------

barnowl is a middleware package which interfaces with low-power wireless receivers (ex: Bluetooth Low Energy, Active RFID).  barnowl collects, processes and outputs a real-time stream of radio events: identifiers, payloads and received signal strengths.  In simpler terms, barnowl tells you what wireless devices (smartphones, wearables, active RFID tags) are transmitting and which re(el)ceivers are decoding them.

Effectively barnowl is lightweight, open source middleware for _bring-your-own-device_ real-time location systems (RTLS) and machine to machine (M2M) communications.


### In the scheme of Things (pun intended)

The barnowl, [barnacles](https://www.npmjs.com/package/barnacles), [barterer](https://www.npmjs.com/package/barterer) and [chickadee](https://www.npmjs.com/package/chickadee) packages all work together as a unit, conveniently bundled as [hlc-server](https://www.npmjs.com/package/hlc-server).  Check out our [developer page](https://reelyactive.github.io/) for more resources on reelyActive software and hardware.


![barnowl logo](https://reelyactive.github.io/barnowl/images/barnowl-bubble.png)


What's in a name?
-----------------

The Barn Owl has the best hearing of any animal tested.  Since this middleware is effectively listening (via hardware 'ears') for all the wireless devices in a Smart Space, barnowl would seem a more than fitting name.  Moreover, [Wikipedia introduces the Barn Owl](https://en.wikipedia.org/wiki/Barn_owl) as "the most widely distributed species of owl, and one of the most widespread of all birds".  An ambitiously inspiring fact considering our vision for a global crowdsourced infrastructure of Wireless Sensor Networks in the Internet of Things (IoT).

Don't think we can top that?  Well check out this quote: "the barn owl is the most economically beneficial species to humans".  Yes, [apparently](http://www.hungryowl.org/education/natural_history.html) the U.S. Fish and Wildlife Service is prepared to argue so.  _Too ambitious?_  Well, consider this quote from [Jeremy Rifkin](https://en.wikipedia.org/wiki/Jeremy_Rifkin): "What makes the IoT a disruptive technology in the way we organize economic life is that it helps humanity reintegrate itself into the complex choreography of the biosphere, and by doing so, dramatically increases productivity without compromising the ecological relationships that govern the planet."

Can a few thousand lines of server-side Javascript known as barnowl really live up to that?  Owl we know is it can tyto do its nest!


Installation
------------

    npm install barnowl


Allo Hibou! Show me some code!
------------------------------

Even without any sensor hardware (which you can [buy here](https://shop.reelyactive.com/collections/starter-kits)), it's easy to get started.  The following code will listen to _simulated_ hardware and output packets to the console:

```javascript
var barnowl = require("barnowl");
var middleware = new barnowl();

// See "Where to listen?" section
middleware.bind( { protocol: 'test', path: 'default' } ); 

middleware.on('visibilityEvent', function(tiraid) {
  var prettyTiraid = JSON.stringify(tiraid, null, " ");
  console.log(prettyTiraid);
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
        "rssi": 128,
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


Add hardware to the mix
-----------------------

barnowl requires a source of reelyActive sensor reel packets.  These originate from a reel of reelceivers.  The packet stream may arrive via a local serial connection or encapsulated in UDP packets from a remote source.  reelyActive hardware can be purchased via our [online store](https://shop.reelyactive.com).

Check out [Barnowl Baby Steps](https://reelyactive.github.io/barnowl-baby-steps.html) on our [diyActive page](https://reelyactive.github.io/). Follow the instructions and in a few lines of code you'll be testing out barnowl with live data!


Supported Identifiers
---------------------

barnowl supports Bluetooth Low Energy (BLE) and reelyActive identifiers via [advlib](https://www.npmjs.com/package/advlib), our open source low-power-wireless advertising packet parsing library.

### Bluetooth Low Energy (BLE)

All BLE advertising packets are supported, and these use the 48-bit advertiser address as an identifier.  All header and data fields are processed to some extent by [advlib](https://www.npmjs.com/package/advlib), which is updated frequently.  The packet below illustrates a selection of these fields (note that it is _not_ a valid BLE packet).

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
          "flags": ["LE Limited Discoverable Mode","BR/EDR Not Supported"],
          "completeLocalName": "reelyActive",
          "manufacturerSpecificData": {
            "companyIdentifierCode": "abcd",
            "data": "12345678",
            "iBeacon": {
              "uuid": "00112233445566778899aabbccddeeff",
              "major": "0000",
              "minor": "0000",
              "txPower": "-59dBm" 
            }
          }
        }
      }
    }

### reelyActive

All reelyActive devices use a globally unique EUI-64 identifier and may contain (optional) data.

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

### UDP

Listening for UDP packets requires binding barnowl to an IP address and port on the __local__ machine.  For example if the machine running barnowl has an Ethernet interface with IP address 192.168.1.101, and hardware packets are being sent to that interface on port 50000, then barnowl should listen on that IP address and port as follows:

```javascript
middleware.bind( { protocol: 'udp', path: '192.168.1.101:50000' } );
```

### Serial

Listening on a serial interface requires the [serialport](https://www.npmjs.com/package/serialport) package.  This is NOT included as a dependency since it may not be trivial to install depending on the hardware and operating system.  Ensure that [serialport](https://www.npmjs.com/package/serialport) is installed before you bind barnowl to a serial interface!  Specify the serial interface to listen on as follows:

```javascript
middleware.bind( { protocol: 'serial', path: '/dev/ttyUSB0' } );
```

If you're using the [reelyActive USB Hub](http://shop.reelyactive.com/products/usb-hub) and don't know the exact path, you can instead try:

```javascript
middleware.bind( { protocol: 'serial', path: 'auto' } );
```

If successful, the path will be auto-determined and, for future reference, output to the console (along with any alternative paths to try).

| barnowl version | serialport version |
|:---------------:|:------------------:|
| >=0.4.22        | >=4.0.0            |
| <=0.4.21        | <=3.x.x            |

### HCI (Bluetooth)

Listening on a Bluetooth HCI interface requires the [bluetooth-hci-socket](https://www.npmjs.com/package/bluetooth-hci-socket) package.  This is NOT included as a dependency since it may not be trivial to install depending on the hardware and operating system, only a subset of which are supported (ex: Linux).  Ensure that [bluetooth-hci-socket](https://www.npmjs.com/package/bluetooth-hci-socket) is installed before you bind barnowl to an HCI interface!  Specify the serial interface to listen on as follows:

```javascript
middleware.bind( { protocol: 'hci', path: null } );
```

If successful, the Bluetooth HCI device will enter active scanning mode.  Check the console log to determine the device's public MAC address and how this is interpreted by barnowl, for example:

    HCI Bluetooth address is fee150bada55, query as receiver 001bc50940bada55


### BlueCats UDP

Listening for UDP packets from a BlueCats Edge Relay requires binding barnowl to an IP address and port on the __local__ machine.  For example if the machine running barnowl has an Ethernet interface with IP address 192.168.1.101, and hardware packets are being sent to that interface on port 50000, then barnowl should listen on that IP address and port as follows:

```javascript
middleware.bind( { protocol: 'bluecats-udp', path: '192.168.1.101:50000' } );

See our [Configure a BlueCats Edge Relay](https://reelyactive.github.io/configure-a-bluecats-edgerelay.html) tutorial for all prerequisites.


### Events

Listening to [Node.js Events](http://nodejs.org/api/events.html) requires binding barnowl to an EventEmitter.  Listening to events is a simple means to connect barnowl with alternative data sources.  For instance, you might create an EventEmitter that outputs historical data from a file.  Or you might create an EventEmitter to facilitate integration with hardware like the UART of a [Tessel](https://tessel.io/).

```javascript
middleware.bind( { protocol: 'event', path: eventSource } );
```

### Test

As of version 0.4.4 there's a built-in _simulated_ hardware packet generator that can be helpful for getting started and debugging.  A reelyActive and a Bluetooth Smart packet will be produced every second, each decoded on two reelceivers with RSSI values in continuous random flux.

```javascript
middleware.bind( { protocol: 'test', path: 'default' } );
```

It _is_ possible to bind barnowl to multiple interfaces (UDP, serial, event, test) simultaneously.

It is also possible for barnowl to reattempt the bind if an error occurs.  Add to the bind options _retryMilliseconds: n_ where _n_ is an integer representing the number of milliseconds to delay before reattempting.

__Important: When using hardware produced before May 2014, add the following parameter to ensure correct operation. Thanks for your understanding!__

```javascript
middleware.bind( { protocol: 'udp', path: '192.168.1.101:50000', prefix: '' } );
```

Reel Events
-----------

Listen for sensor reel events with the following code:

```javascript
middleware.on('reelEvent', function(data) {
  var prettyData = JSON.stringify(data, null, " ");
  console.log(prettyData);
});
```

### reelceiverStatistics

Sent every 60 seconds by each reelceiver, with all counts relative to that period.  Example:

    {
      "type": "reelceiverStatistics",
      "timestamp": "2014-01-01T01:23:45.678Z",
      "time": 1388539425678,
      "receiverId": "001bc50940810000",
      "uptimeSeconds": 60,
      "sendCount": 1234,
      "crcPass": 1234,
      "crcFail": 56,
      "maxRSSI": 190,
      "avgRSSI": 150,
      "minRSSI": 135,
      "temperatureCelcius": 25,
      "radioVoltage": 3.3
    }

### reelceiverConnection

Sent whenever a new reelceiver connection is detected.  Example:

    {
      "type": "reelceiverConnection",
      "timestamp": "2014-01-01T01:23:45.678Z",
      "time": 1388539425678,
      "receiverId": "001bc50940810000",
      "origin": "/dev/ttyUSB0"
    }

### reelceiverDisconnection

Sent whenever a reelceiver is considered disconnected after at least 60 seconds of inactivity based on its packet stream.  Example:

    {
      "type": "reelceiverDisconnection",
      "timestamp": "2014-01-01T01:23:45.678Z",
      "time": 1388539425678,
      "receiverId": "001bc50940810000"
    }

### reelMapState

Sent every 60 seconds, and following a reelceiverConnection, to provide a mapping of the reels by origin (see [Where to Listen?](#where-to-listen)) and the reelceivers by reel offset (index of position from end of reel).  Example:

    {
      "type": "reelMapState",
      "timestamp": "2014-01-01T01:23:45.678Z",
      "time": 1388539425678,
      "origins": {
        "/dev/ttyUSB0": {
          "reelOffsets": [
            "001bc50940810000"
          ]
        }
      }
    }


Advanced Parameters
-------------------

The following options are supported when instantiating barnowl (those shown are the defaults):

    {
      n: 1,
      enableMixing: false,
      mixingDelayMilliseconds: 1000,
      minMixingDelayMilliseconds: 5
    }

### Maximum Strongest Radio Decodings

It is possible to specify the maximum number of strongest radio decodings to include in visibility events.  This setting could be used for triangulation.  For instance, to set this to 3, instantiate barnowl as follows:

```javascript
var middleware = new barnowl( { n: 3 } );
```

### Mix Multiple Sources

It is possible to enable a temporal mixing queue which compensates for the case where multiple sources detect the same radio transmission.  For example, if distinct reels are in such proximity that they detect the same devices, this setting should be enabled.  By default this setting is disabled to reduce the memory and computation footprint of barnowl.  To enable the temporal mixing queue, instantiate barnowl as follows:

```javascript
var middleware = new barnowl( { enableMixing: true } );
```

### Adjust Mixing Delay

If enableMixing is set to true, the mixing delay specifies the maximum time to wait for additional decodings of the same radio transmission to arrive.  The value can be increased from the default to compensate for long network delays or reduced to minimise latency.  To reduce the mixing delay to 100 milliseconds, instantiate barnowl as follows:

```javascript
var middleware = new barnowl( { mixingDelayMilliseconds: 100 } );
```

A minimum mixing delay can also be specified to fine-tune between real-time and batch processing.  To set the minimum mixing delay to 10 milliseconds, instantiate barnowl as follows:

```javascript
var middleware = new barnowl( { minMixingDelayMilliseconds: 10 } );
```


What's next?
------------

This is an active work in progress.  Expect regular changes and updates, as well as improved documentation!  If you're developing with barnowl check out:
* [diyActive](https://reelyactive.github.io/) our developer page
* our [node-style-guide](https://github.com/reelyactive/node-style-guide) for development
* our [contact information](http://www.reelyactive.com/contact/) to get in touch if you'd like to contribute


License
-------

MIT License

Copyright (c) 2014-2017 reelyActive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
