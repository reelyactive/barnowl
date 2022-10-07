barnowl
=======


Technology-agnostic middleware for RFID, RTLS and M2M
-----------------------------------------------------

__barnowl__ converts RF decodings into software-developer-friendly JSON.  It abstracts away all the complexity of radio protocols (ex: BLE, RAIN RFID, EnOcean, ...) and vendor-specific infrastructure to provide developers with a simple, standardised data structure to build software applications.

![barnowl overview](https://reelyactive.github.io/barnowl/images/barnowl-overview.png)

__barnowl__ outputs a real-time stream of [raddec](https://github.com/reelyactive/raddec/) objects which facilitate any and all of the following applications:
- RFID: _what_ is present, based on the device identifier?
- RTLS: _where_ is it relative to the receiving devices?
- M2M: _how_ is its status, based on any payload included in the packet?

__barnowl__ is a lightweight [Node.js package](https://www.npmjs.com/package/barnowl) that can run on resource-constrained edge devices as well as on powerful cloud servers and anything in between.  It is the keystone in [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere/) open source middleware of the [reelyActive technology platform](https://www.reelyactive.com/technology/).


Installation
------------

    npm install barnowl



Hello barnowl!
--------------

Even without any hardware, it's easy to get started.  The following code will listen to _simulated_ hardware and output packets to the console:

```javascript
const Barnowl = require('barnowl');

let barnowl = new Barnowl();

barnowl.on("raddec", function(raddec) {
  console.log(raddec);
});

barnowl.addListener(Barnowl, {}, Barnowl.TestListener, {});
```

As output you should see a stream of [raddec](https://github.com/reelyactive/raddec/) objects similar to the following:

```javascript
{
  transmitterId: "001122334455",
  transmitterIdType: 2,
  rssiSignature:
   [ { receiverId: "001bc50940810000",
       receiverIdType: 1,
       numberOfDecodings: 1,
       rssi: -60 },
     { receiverId: "001bc50940810001",
       receiverIdType: 1,
       numberOfDecodings: 1,
       rssi: -66 } ],
  packets: [ "061b55443322110002010611074449555520657669746341796c656572" ],
  timestamp: 1547693457133
}
```

Regardless of the underlying RF protocol and hardware, the [raddec](https://github.com/reelyactive/raddec/) specifies _what_ (transmitterId) is _where_ (receiverId & rssi), as well as _how_ (packets) and _when_ (timestamp).


Is that owl you can do?
-----------------------

While __barnowl__ may suffice standalone for simple real-time applications, its functionality can be greatly extended with the following software packages:
- [advlib](https://github.com/reelyactive/advlib) to decode the individual packets from hexadecimal strings into JSON
- [barnacles](https://github.com/reelyactive/barnacles) to distribute the real-time data stream via APIs and more

These packages and more are bundled together as the [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere) open source middleware suite, which includes several __barnowl__ listeners, as described next.


Where to listen?
----------------

__barnowl__ includes a TestListener (see the _Hello barnowl!_ example above) and a UdpListener (see the first example below) while all other listeners exist as separate software packages to keep the code as lightweight and modular as possible.  The following table lists all these listener packages which integrate seamlessly with __barnowl__ in just two lines of code.

| Listener package                                                  | Use with |
|:------------------------------------------------------------------|:---------|
| [barnowl-reel](https://github.com/reelyactive/barnowl-reel)       | reelyActive hardware (BLE, sub-GHz active RFID) |
| [barnowl-hci](https://github.com/reelyactive/barnowl-hci)         | BLE radios on Linux computers (ex: Raspberry Pi, PC, ...) |
| [barnowl-minew](https://github.com/reelyactive/barnowl-minew)     | Minew gateways (ex: G1) |
| [barnowl-laird](https://github.com/reelyactive/barnowl-laird)     | Laird Connectivity gateways (ex: IG60-BL654) |
| [barnowl-aruba](https://github.com/reelyactive/barnowl-aruba)     | Aruba access points (ex: 303H) |
| [barnowl-huawei](https://github.com/reelyactive/barnowl-huawei)   | Huawei access points |
| [barnowl-impinj](https://github.com/reelyactive/barnowl-impinj)   | Impinj RFID readers |
| [barnowl-rfcontrols](https://github.com/reelyactive/barnowl-rfcontrols) | RF Controls RFC OS |
| [barnowl-enocean](https://github.com/reelyactive/barnowl-enocean) | EnOcean (ex: USB dongle) |
| [barnowl-tcpdump](https://github.com/reelyactive/barnowl-tcpdump) | WiFi radios on computers that can run tcpdump |

### Example: UDP raddecs

```javascript
const Barnowl = require('barnowl');

let barnowl = new Barnowl();

barnowl.on("raddec", function(raddec) { /* Handle the raddec */ });

// Add the included UDP listener with relevant options
barnowl.addListener(Barnowl, {}, Barnowl.UdpListener, { path: "0.0.0.0:50001" });
```

### Example: reelyActive hardware connected via serial port

```javascript
const Barnowl = require('barnowl');
const BarnowlReel = require('barnowl-reel'); // 1: Include the interface package

let barnowl = new Barnowl();

barnowl.on("raddec", function(raddec) { /* Handle the raddec */ });

// 2: Add the specific listener with relevant options
barnowl.addListener(BarnowlReel, {}, BarnowlReel.SerialListener, { path: "auto" });
```

### Example: built-in BLE radio of a Raspberry Pi

```javascript
const Barnowl = require('barnowl');
const BarnowlHci = require('barnowl-hci'); // 1: Include the interface package

let barnowl = new Barnowl();

barnowl.on("raddec", function(raddec) { /* Handle the raddec */ });

// 2: Add the specific listener with relevant options
barnowl.addListener(BarnowlHci, {}, BarnowlHci.SocketListener, {});
```

### Example: WiFi radio on computer with tcpdump installed

```javascript
const Barnowl = require('barnowl');
const BarnowlTcpdump = require('barnowl-tcpdump'); // 1: Include the package

let barnowl = new Barnowl();

barnowl.on("raddec", function(raddec) { /* Handle the raddec */ });

// 2: Add the specific listener with relevant options
barnowl.addListener(BarnowlTcpdump, {}, BarnowlTcpdump.SpawnListener, {});
```

### Example: reelyActive hardware & tcpdump

__barnowl__ supports multiple simultaneous listeners and will mix decodings of the same transmission from different sources provided that the _enableMixing_ feature is enabled.  For instance, the reelyActive Owl-in-One combines a BLE and WiFi source.

```javascript
const Barnowl = require('barnowl');
const BarnowlReel = require('barnowl-reel');       // 1: Include each of the
const BarnowlTcpdump = require('barnowl-tcpdump'); //    interface packages

let barnowl = new Barnowl({ enableMixing: true });

barnowl.on("raddec", function(raddec) { /* Handle the raddec */ });

let uart = /* */; // In this case the uart is an emitter of 'data' events

// 2: Add the specifics listener with relevant options
barnowl.addListener(BarnowlReel, {}, BarnowlReel.EventListener, { path: uart });
barnowl.addListener(BarnowlTcpdump, {}, BarnowlTcpdump.SpawnListener, {});
```


Options
-------

__barnowl__ supports the following options:

| Property                   | Default | Description                         | 
|:---------------------------|:--------|:------------------------------------|
| enableMixing               | false   | Mix together decodings from the same transmitter  |
| mixingDelayMilliseconds    | 1000    | Maximum time for any decoding to spend in the mixing queue |
| minMixingDelayMilliseconds | 5       | Minimum time to delay between subsequent queue managements |
| encodeRaddecs              | false   | Output raddecs as hex strings rather than as JSON |
| acceptFutureRaddecs        | true    | raddecs with future timestamps are adjusted to current time and accepted, else rejected |

In most use cases, _enableMixing_ should be set to _true_ except under extreme memory constraints and/or when absolutely no processing delay can be tolerated.  Mixing decodings into a single [raddec](https://github.com/reelyactive/raddec/) provides lossless compression and promotes efficient data distribution and processing.

```javascript
let barnowl = new Barnowl({ enableMixing: true }); // Recommended
```


![barnowl logo](https://reelyactive.github.io/barnowl/images/barnowl-bubble.png)


What's in a name?
-----------------

The Barn Owl has the best hearing of any animal tested.  Since this middleware is effectively listening (via hardware 'ears') for all the wireless devices in a Smart Space, barnowl would seem a more than fitting name.  Moreover, [Wikipedia introduces the Barn Owl](https://en.wikipedia.org/wiki/Barn_owl) as "the most widely distributed species of owl, and one of the most widespread of all birds".  An ambitiously inspiring fact considering our vision for a global crowdsourced infrastructure of Wireless Sensor Networks in the Internet of Things (IoT).

Don't think we can top that?  Well check out this quote: "the barn owl is the most economically beneficial species to humans".  Yes, [apparently](http://www.hungryowl.org/education/natural_history.html) the U.S. Fish and Wildlife Service is prepared to argue so.  _Too ambitious?_  Well, consider this quote from [Jeremy Rifkin](https://en.wikipedia.org/wiki/Jeremy_Rifkin): "What makes the IoT a disruptive technology in the way we organize economic life is that it helps humanity reintegrate itself into the complex choreography of the biosphere, and by doing so, dramatically increases productivity without compromising the ecological relationships that govern the planet."

Can a few hundred lines of server-side Javascript known as barnowl really live up to that?  Owl we know is it can tyto do its nest!


Project History
---------------

__barnowl__ is [reelyActive](https://www.reelyactive.com)'s original open source package, which, when initially released in 2014, decoded wireless packets specifically from [reelceivers](https://www.reelyactive.com/products/gateways/#reelceiver).  As third-party hardware became available, and technologies such as Bluetooth Low Energy emerged as global standards, __barnowl__ evolved into the vendor-and-technology-agnostic middleware it is today. 

__barnowl__ v1.0.0 was released in January 2019, superseding all earlier versions, the latest of which remains available in the [release-0.4 branch](https://github.com/reelyactive/barnowl/tree/release-0.4) and as [barnowl@0.4.28 on npm](https://www.npmjs.com/package/barnowl/v/0.4.28).


Contributing
------------

Discover [how to contribute](CONTRIBUTING.md) to this open source project which upholds a standard [code of conduct](CODE_OF_CONDUCT.md).


Security
--------

Consult our [security policy](SECURITY.md) for best practices using this open source software and to report vulnerabilities.

[![Known Vulnerabilities](https://snyk.io/test/github/reelyactive/barnowl/badge.svg)](https://snyk.io/test/github/reelyactive/barnowl)


License
-------

MIT License

Copyright (c) 2014-2022 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
