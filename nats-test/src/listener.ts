import { randomBytes } from "crypto";
import nats, { Message, Stan } from "node-nats-streaming";

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

abstract class Listener {
  abstract subject: string;
  abstract queueGroupName: string;
  abstract onMessage(data: any, msg: Message): void;
  private client: Stan;
  protected ackWait = 5 * 1000;

  constructor(client: Stan) {
    this.client = client;
  }

  subscriptionOptions() {
    return this.client
      .subscriptionOptions()
      .setDeliverAllAvailable()
      .setManualAckMode(true)
      .setAckWait(this.ackWait)
      .setDurableName(this.queueGroupName);
  }

  listen() {
    const subscription = this.client.subscribe(
      this.subject,
      this.queueGroupName,
      this.subscriptionOptions()
    );

    subscription.on("message", (msg: Message) => {
      console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);

      const parsedData = this.parseMessage(msg);
      /**
       * - คลาสลูกจะ implement เอง ว่าจะให้ทำอะไรกับ message ที่ได้รับ
       * - คลาสแม่จะ ไม่รู้รายละเอียด แต่จะ "ไว้ใจ" ให้คลาสลูกจัดการเอง
       */
      this.onMessage(parsedData, msg);
    });
  }

  parseMessage(msg: Message) {
    const data = msg.getData();

    return typeof data === "string"
      ? JSON.parse(data)
      : JSON.parse(data.toString("utf-8"));
  }
}

class TicketCreatedLister extends Listener {
  subject = "ticket:created";
  queueGroupName = "order-service";

  // จัดการเมื่อ message เข้ามา
  onMessage(data: any, msg: Message): void {
    console.log("🎫 Ticket created event data:", data);

    // ทำงานอื่น เช่น บันทึกลง database, ตรวจสอบข้อมูล ฯลฯ

    msg.ack(); // ยืนยันว่า message นี้ถูกประมวลผลแล้ว
  }
}




/**
 * สร้าง instance จากคลาสลูก TicketCreatedLister
 */
const stan = nats.connect("ticketing", randomBytes(4).toString("hex"), {
  url: "http://localhost:4222",
});

stan.on("connect", () => {
  console.log("✅ Connected to NATS");

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
