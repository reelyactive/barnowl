barnowl
=======


Middleware for low-power wireless radio infrastructure
------------------------------------------------------

barnowl is a middleware package which interfaces with low-power wireless receivers (ex: Bluetooth Low Energy, Active RFID).  barnowl collects, processes and outputs a real-time stream of radio decodings (specifically raddecs).  In simpler terms, barnowl translates the cacophony of packets from wireless devices (smartphones, wearables, sensors, RFID tags) into a optimised stream of standardised data objects.

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
const Barnowl = require('barnowl');

let middleware = new Barnowl({ enableMixing: true });

middleware.on("raddec", function(radioDecoding) {
  console.log(radioDecoding);
});

middleware.addListener(Barnowl, { type: "test", radioDecodingPeriod: 500 });
```


What's next?
------------

The reelyActive team is currently overhauling barnowl for a v1.0.0 release.  This is very much an active work in progress.  If you're developing with barnowl check out:
* [diyActive](https://reelyactive.github.io/) our developer page
* our [node-style-guide](https://github.com/reelyactive/node-style-guide) for development
* our [contact information](http://www.reelyactive.com/contact/) to get in touch if you'd like to contribute


License
-------

MIT License

Copyright (c) 2014-2018 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
