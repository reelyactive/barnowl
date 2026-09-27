/**
 * Copyright reelyActive 2022-2026
 * We believe in an open Internet of Things
 */


import dgram from "node:dgram";
import Raddec from "raddec";


// Constants
const DEFAULT_PATH = "0.0.0.0:50001";


/**
 * UdpListener Class
 * Listens for raddecs on a UDP port.
 */
class UdpListener {

  /**
   * UdpListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options = {}) {
    options.path = options.path || DEFAULT_PATH;

    const host = options.path.split(":")[0];
    const port = options.path.split(":")[1];

    this.metrics = {};
    this.server = dgram.createSocket("udp4");
    handleSocketEvents(this.server);
    this.server.bind(port, host);
  }

  /**
   * Provide a readable stream of asynchronous messages.
   * @param {AbortSignal} signal - The abort signal.
   * @returns {ReadableStream} - A readable stream of messages.
   */
  observeMessageStream(signal) {
    const server = this.server;

    return new ReadableStream({
      start(controller) {
        server.on("message", (data) => {
          try {
            const raddec = new Raddec(data);

            if(raddec !== null) {
              const message = { type: "raddec", detail: raddec };
              controller.enqueue(message);
            }
          }
          catch(error) {
            // TODO: log error stats for packets that aren't valid raddecs?
          }  
        });

        server.on("error", (error) => { controller.error(error); });
      },
      cancel() {
        server.removeAllListeners("message"); // TODO: remove only the specific
                                              //       message listener?
      }
    });
  }

  /**
   * Provide the latest compiled metrics.
   * @returns {object} - Metrics for this listener.
   */
  getMetrics() {
    return { ...this.metrics };
  }

}


/**
 * Handle events from the UDP server.
 * @param {dgram.Socket} server - The UDP socket.
 */
function handleSocketEvents(server) {
  server.on("listening", () => {
    const address = server.address();
    console.log(`barnowl: UDP listening on ${address.address}:${address.port}`);
  });

  server.on("error", (error) => {
    console.log(`barnowl: UDP error ${error}`);
    server.close();
  });
}


export default UdpListener;
