var barnOwl = require('./lib/barnowl');
var http = require('http');
var dgram = require('dgram');
//var json2html = require('node-json2html');


/****************************************************************************/
/* Configuration  (this is the only section you might want to tweak)        */
/*                                                                          */
/* HOST:     IP address on which to host the webpage and receive packets    */
/*           127.0.0.1 means you can visit the webpage at http://localhost  */
/* PORT:     Port on which to send/receive packets                          */
/*           50000 is likely to be an available port                        */
/* INTERVAL: Milliseconds between subsequent simulated hardware packets     */
/*           2000 means that packets will be sent every 2 seconds           */
/* CSS:      HTML link to a CSS file that makes the table look pretty       */
/*           The default is a CSS file hosted on reelyactive.com            */
/****************************************************************************/
var HOST = '127.0.0.1';
var PORT = 50000;
var HTTP_PORT = 3001;
var INTERVAL = 2000;
var CSS = '<link rel="stylesheet" type="text/css" href="http://reelyactive.com/style/barnowl-test.css">';
/****************************************************************************/


var HEADER = '<head>'+CSS+'</head>';
var identifierTable = {};
var transformIdentifier = {'tag':'td','html':'${identifier.value}'};
var transformTime = {'tag':'td','html':'${timestamp}'};
var transformRSSI = {'tag':'td','html':'${rssi}'};
var barnOwlInstance = new barnOwl();
var server = http.createServer();
var socket = dgram.createSocket('udp4');
socket.bind();


/**
 * Send a simulated hardware packet to the HOST
 */
function sendPacket() {
  var simulatedPacket = new Buffer('f001ed4a11aaaa7800008000000000000000000000000000000000503300aaaa0401b00b1e500000aaaa7801008100000000000000000000000000000000503300aaaa2001421e55daba50e1fe0201050c097265656c7941637469766507fffee150bada550100', 'hex');
  socket.send(simulatedPacket, 0, simulatedPacket.length, PORT, HOST);
}

setInterval(sendPacket, INTERVAL);


/**
 * Listen for hardware packets and store them in a table indexed by their
 * unique identifier 
 */
barnOwlInstance.on('visibilityEvent', function(tiraid) {
  identifierTable[tiraid.identifier.value] = tiraid;
  console.log(tiraid); 
}); 

barnOwlInstance.bind('udp', HOST + ':' + PORT);


/**
 * Generate HTML so that the table of identified devices displays in a browser
 */
console.log('HTTP Server listening on port ' + HTTP_PORT);
server.on('request', function(req, res) {
  
	console.log('Request received on port ' + HTTP_PORT + ' (HTTP)');
	
	for (var identifier in identifierTable) {
	
		var tiraid = identifierTable[identifier];
		html = tiraid + '<br />';
  
	}

  	res.writeHead(200, {'Content-Type': 'text/html'});
  	res.end(HEADER+'<body><table cellspacing="0">' + html + '</table></body>');

});

server.listen(HTTP_PORT);
