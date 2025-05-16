import { randomBytes } from "crypto";
import nats, { Message } from "node-nats-streaming";

console.clear();

const stan = nats.connect("ticketing", randomBytes(4).toString("hex"), {
  url: "http://localhost:4222",
});

stan.on("connect", () => {
  console.log("Listener connected to NATS");

  /** Setting options */
  const options = stan.subscriptionOptions().setManualAckMode(true);
  /**
   * ticket:created คือชื่อ chanel
   * order-service-queue-group คือคิวกรุ๊ปของ ticket:created chanel
   */
  const subscription = stan.subscribe(
    "ticket:created",
    "order-service-queue-group",
    options
  );

  subscription.on("message", (msg: Message) => {
    console.log("Message recieved");

    /**
     * Method ที่ใช้บ่อยๆ
     * - getSubject() คือ Returns the subject accociated with this msg.
     * - getSequence() คือ Returns number of events, in NATS event start off 1.
     * - getData() คือ Returns acture data
     */

    const data = msg.getData();
    if (typeof data === 'string') {
      console.log(`Received event #${msg.getSequence()}, with data ${data}`);
    }

    msg.ack();
  });
});
