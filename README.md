barnowl
=======


Technology-agnostic middleware for RFID, RTLS and M2M
-----------------------------------------------------

__barnowl__ converts RF decodings into software-developer-friendly JSON.  It abstracts away all the complexity of radio protocols (ex: BLE, RFID, WiFi, ...) and vendor-specific infrastructure to provide developers with a simple, standardised data structure to build software applications.

![barnowl overview](https://reelyactive.github.io/barnowl/images/barnowl-overview.png)

__barnowl__ outputs a real-time stream of [raddec](https://github.com/reelyactive/raddec/) objects which facilitate any and all of the following applications:
- RFID: _what_ is present, based on the device identifier?
- RTLS: _where_ is it relative to the receiving devices?
- M2M: _how_ is its status, based on any payload included in the packet?

__barnowl__ is a lightweight [Node.js package](https://www.npmjs.com/package/barnowl) that can run on resource-constrained edge devices as well as on powerful cloud servers and anything in between.  It is the keystone in the [reelyActive technology platform](https://www.reelyactive.com/technology/), which includes a wealth of complementary software and hardware.


Installation
------------

    npm install barnowl


Hello barnowl!
--------------

Even without any hardware, it's easy to get started.  The following code will listen to _simulated_ hardware and output packets to the console:

```javascript
const Barnowl = require('barnowl');

let barnowl = new Barnowl({ enableMixing: true });

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

Regardless of the underlying RF protocol and hardware, the raddec species _what_ (transmitterId) is _where_ (receiverId & rssi), as well as _how_ (packets) and _when_ (timestamp).


Is that owl you can do?
-----------------------

While __barnowl__ may suffice standalone for simple real-time applications, its functionality can be greatly extended with the following software packages:
- [advlib](https://github.com/reelyactive/advlib) to decode the individual packets from hexadecimal strings into JSON
- [barnacles](https://github.com/reelyactive/barnacles) to distribute the real-time data stream via APIs and more


Where to listen?
----------------

__barnowl__ includes a TestListener (see the _Hello barnowl!_ example above) while all other listeners exist as separate software packages to keep the code as lightweight and modular as possible.  The following table lists all these listener packages which integrate seamlessly with __barnowl__ in just two lines of code.

| Listener package | Use with |
|------------------|----------|
| [barnowl-reel](https://github.com/reelyactive/barnowl-reel) |
  reelyActive hardware (BLE, sub-GHz active RFID) |
| [barnowl-hci](https://github.com/reelyactive/barnowl-hci)   |
  BLE radios on Linux computers (ex: Raspberry Pi, PC, ...) |
| [barnowl-tcpdump](https://github.com/reelyactive/barnowl-tcpdump) |
  WiFi radios on computers that can run tcpdump |

For instance, listening for reelyActive hardware connected via a serial port requires just the addition of two lines of code:

```javascript
const Barnowl = require('barnowl');
const BarnowlReel = require('barnowl-reel'); // 1: Include the listener package

let barnowl = new Barnowl({ enableMixing: true });

barnowl.on("raddec", function(raddec) {
  console.log(raddec);
});

// 2: Add the specific listener with relevant options
barnowl.addListener(BarnowlReel, {}, BarnowlReel.SerialListener, { path: "auto" });
```


![barnowl logo](https://reelyactive.github.io/barnowl/images/barnowl-bubble.png)


What's in a name?
-----------------

The Barn Owl has the best hearing of any animal tested.  Since this middleware is effectively listening (via hardware 'ears') for all the wireless devices in a Smart Space, barnowl would seem a more than fitting name.  Moreover, [Wikipedia introduces the Barn Owl](https://en.wikipedia.org/wiki/Barn_owl) as "the most widely distributed species of owl, and one of the most widespread of all birds".  An ambitiously inspiring fact considering our vision for a global crowdsourced infrastructure of Wireless Sensor Networks in the Internet of Things (IoT).

Don't think we can top that?  Well check out this quote: "the barn owl is the most economically beneficial species to humans".  Yes, [apparently](http://www.hungryowl.org/education/natural_history.html) the U.S. Fish and Wildlife Service is prepared to argue so.  _Too ambitious?_  Well, consider this quote from [Jeremy Rifkin](https://en.wikipedia.org/wiki/Jeremy_Rifkin): "What makes the IoT a disruptive technology in the way we organize economic life is that it helps humanity reintegrate itself into the complex choreography of the biosphere, and by doing so, dramatically increases productivity without compromising the ecological relationships that govern the planet."

Can a few hundred lines of server-side Javascript known as barnowl really live up to that?  Owl we know is it can tyto do its nest!


What's next?
------------

The reelyActive team is currently overhauling barnowl for a v1.0.0 release.  This is very much an active work in progress.  If you're developing with barnowl check out:
* [diyActive](https://reelyactive.github.io/) our developer page
* our [node-style-guide](https://github.com/reelyactive/node-style-guide) for development
* our [contact information](https://www.reelyactive.com/contact/) to get in touch if you'd like to contribute


License
-------

MIT License

Copyright (c) 2014-2019 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
