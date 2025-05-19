import { randomBytes } from "crypto";
import nats from "node-nats-streaming";

import { TicketCreatedLister } from "./events/ticket-created-listen";

console.clear();

/** stan หรือ client */
// const stan = nats.connect("ticketing", randomBytes(4).toString("hex"), {
//   url: "http://localhost:4222",
// });

// stan.on("connect", () => {
//   console.log("Listener connected to NATS");

//   stan.on("close", () => {
//     console.log("Listener connected to NATS");
//     process.exit();
//   });

//   /** Setting options */
//   const options = stan
//     .subscriptionOptions()
//     .setManualAckMode(true)
//     .setDeliverAllAvailable()
//     .setDurableName("accouting-service");
//   /**
//    * ticket:created คือชื่อ chanel
//    * order-service-queue-group คือคิวกรุ๊ปของ ticket:created chanel
//    */
//   const subscription = stan.subscribe(
//     "ticket:created",
//     "order-service-queue-group",
//     options
//   );

//   subscription.on("message", (msg: Message) => {
//     console.log("Message recieved");

//     /**
//      * Method ที่ใช้บ่อยๆ
//      * - getSubject() คือ Returns the subject accociated with this msg.
//      * - getSequence() คือ Returns number of events, in NATS event start off 1.
//      * - getData() คือ Returns acture data
//      */

//     const data = msg.getData();
//     if (typeof data === "string") {
//       console.log(`Received event #${msg.getSequence()}, with data ${data}`);
//     }

//     msg.ack();
//   });
// });

// /**
//  * Handlers to watch for any signle time that someone tries to close down this process. เช่น ctr+C หรือรัน rs
//  */
// process.on("SIGINT", () => stan.close());
// process.on("SIGTERM", () => stan.close());





/**
 * สร้าง instance จากคลาสลูก TicketCreatedLister
 */
const stan = nats.connect("ticketing", randomBytes(4).toString("hex"), {
  url: "http://localhost:4222",
});

stan.on("connect", () => {
  console.log("✅ Connected to NATS");

  stan.on("close", () => {
    console.log("Listener connected to NATS");
    process.exit();
  });

  // ✅ สร้าง instance ของคลาสลูก
  const ticketListener = new TicketCreatedLister(stan);

  /**
   * ✅ เรียกใช้งาน method listen() จากคลาส base Listener เริ่ม "สมัคร" รับ message จาก NATS (Subscribe)
   *   - หลังจากเรียกใช้ .listen() ก็จะเรียกใช้ .onMessage() อัตโนมัติ(ดูที่คลาส base)
   *   - ส่วนจะจัดการ data ที่ได้รับมายังไงนั้น คลาสลูกใน onMessage() ทำ
   *
   * */
  ticketListener.listen();
});

process.on("SIGINT", () => stan.close());
process.on("SIGTERM", () => stan.close());
