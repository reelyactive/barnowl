barnowl
=======

What's in a name?
-----------------

barnowl listens for [reelyActive radio sensor reel packets](http://reelyactive.com/corporate/technology.htm), processes the data stream and emits detected events.  Why the name?  The Barn Owl has the best hearing of any animal tested.

Prerequisite hardware
---------------------

barnowl requires a source of reelyActive sensor reel packets.  These originate from a reel of reelceivers.  The packet stream may arrive via a local serial connection or encapsulated in UDP packets from a remote source.  reelyActive hardware can be purchased via our [online store](http://shop.reelyactive.com).

barnowl runs happily on embedded computers such as the BeagleBone Black, as well as your local machine, as well as in the cloud.

Allo Hibou!
-----------

With the prerequisite hardware in place, it's easy to get started.  First you'll create an instance of barnowl:

```javascript
var barnOwl = require("barnowl");
var barnOwlInstance = new barnOwl();
```

Then you'll tell it where to listen.  Serial connections (such as USB or UART) as well as UDP are currently supported.  It's okay to listen to multiple sources simultaneously:

```javascript
barnOwlInstance.bind('serial', '/dev/ttyUSB0');
barnOwlInstance.bind('udp', '192.168.1.101:50000');
```

At this point, barnowl will process all incoming reel packets and emit any corresponding events.  Simply listen for these events and handle them as appropriate:

```javascript
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

1.  Identifier of the radio transmitter.  reelyActive devices use EUI-64 identifiers.
2.  Timestamp of reception of the transmission.  [ISO8601 format](http://en.wikipedia.org/wiki/ISO_8601).
3.  Radio Decodings of the transmission.  This is an array of reelyActive reelceivers which decoded the transmission, ordered by their received signal strength (RSSI).  reelyActive devices use EUI-64 identifiers.

Notes
-----

Listening on a serial interface requires the [serialport](https://github.com/voodootikigod/node-serialport) package.  This is NOT included as a dependency since it may not be trivial to install depending on the hardware and operating system.  Ensure that [serialport](https://github.com/voodootikigod/node-serialport) is installed before you bind barnowl to a serial interface!

It is possible to specify the maximum number of strongest radio decodings to include in visibility events (the default is 1).  For instance, to set this to 3, instantiate barnowl as follows:

```javascript
var barnOwlInstance = new barnOwl(3);
```


What's next?
------------

This is an active work in progress.  We'll be adding features and making improvements regularly.
