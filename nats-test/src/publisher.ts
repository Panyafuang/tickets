import nats from "node-nats-streaming";
import { TicketCreatedPublisher } from "./events/ticket-created-subject";

console.clear();

const stan = nats.connect("ticketing", "abc", {
  url: "http://localhost:4222",
});

stan.on("connect", async () => {
  console.log("Publisher connected to NATS");

  const publish = new TicketCreatedPublisher(stan);

  /**
   * We want to somehow wait for an event to be published before doing something else.
   */
  try {
    await publish.publish({
      id: "123",
      title: "concert",
      price: 20,
    });
  } catch (err) {
    console.error(err);
  }


  // const data = JSON.stringify({
  //   id: '123',
  //   title: 'concert',
  //   price: 20,
  // });

  // /** ส่งไปที่ chanel ticket:created */
  // stan.publish('ticket:created', data, () => {
  //   console.log('Event published');
  // });
});
