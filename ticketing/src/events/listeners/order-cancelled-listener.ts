import { Listener, IOrderCancelledEvent, Subjects } from "@xtptickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../model/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<IOrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName: string = queueGroupName;

  async onMessage(data: IOrderCancelledEvent["data"], msg: Message) {
    // 1. Find the ticket in ticket collection by id
    const ticket = await Ticket.findById(data.ticket.id);

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // 2. Clear orderId in ticketDoc to undefind
    /**
     * "ตรงนี้เราก็อาจจะใส่ null ได้เหมือนกัน แต่คุณอาจจำได้ว่าในหลายจุดของโปรเจกต์ เราเช็คว่าค่ามีอยู่ไหมด้วยการใช้เครื่องหมายคำถาม (?.) ใน TypeScript ซึ่งวิธีนี้ทำงานได้ดีเมื่อเจอกับ undefined แต่ไม่ค่อยเวิร์คถ้าเจอ null"
     */
    ticket.set({
      orderId: undefined,
    });
    await ticket.save();

    // 3. Publishs ticket updated event
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      price: ticket.price,
      title: ticket.title,
      userId: ticket.userId,
      orderId: ticket.orderId,
      version: ticket.version,
    });

    msg.ack();
  }
}
