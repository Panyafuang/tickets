import nats from "node-nats-streaming";

/**
 * Create client, the client is what is going to actually connect to our streaming server
 * const stan = client
 */
const stan = nats.connect("ticketing", "abc", {
  url: "http://localhost:4222",
});

/** After the client successfully connects to the net, streaming server is going to emit a connect event */
stan.on("connect", () => {
  console.log("Publisher connected to NATS");

  const data = JSON.stringify({
    id: '123',
    title: 'concert',
    price: 20,
  });

  stan.publish('ticket:created', data, () => {
    console.log('Event published');
  });
});
