import { Message } from "node-nats-streaming";

import { Listener } from "./base-listener";
import { ITicketCreatedEvent } from "./ticket-created-event";
import { Subjects } from "./subjects";

export class TicketCreatedLister extends Listener<ITicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName = "order-service";

  // จัดการเมื่อ message เข้ามา
  onMessage(data: ITicketCreatedEvent['data'], msg: Message): void {
    console.log("🎫 Ticket created event data:", data);

    // ทำงานอื่น เช่น บันทึกลง database, ตรวจสอบข้อมูล ฯลฯ

    msg.ack(); // ยืนยันว่า message นี้ถูกประมวลผลแล้ว
  }
}