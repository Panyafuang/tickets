import {
  Listener,
  IOrderCreatedEvent,
  Subjects
} from "@xtptickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../model/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCreatedListener extends Listener<IOrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: IOrderCreatedEvent["data"], msg: Message) {
    // 1. Find the ticket that the order is reserving
    // const ticket = await Ticket.findById(data.ticket.id);

    // if (!ticket) {
    //     throw new Error('Ticket not found');
    // }

    // // 2. Mark the ticket as begin reserved by setting its orderId property
    // ticket.set({
    //     orderId: data.id // data.id คือ orderId ที่มาจาก order-srv (order:created)
    // });
    // await ticket.save();

    // // 3. Publish an event, that is going to alow our different replicated service or services that have replicated data to stay in sync.
    // // this คือ client property on OrderCreatedListener
    // await new TicketUpdatedPublisher(this.client).publish({
    //   id: ticket.id,
    //   price: ticket.price,
    //   title: ticket.title,
    //   userId: ticket.userId,
    //   orderId: ticket.orderId,
    //   version: ticket.version
    // });

    // msg.ack();
  }
}
