import { Subjects, Listener, ITicketUpdatedEvent } from "@xtptickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../models/ticket";



export class TicketUpdatedListener extends Listener<ITicketUpdatedEvent> {
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
    queueGroupName: string = queueGroupName;


    async onMessage(data: ITicketUpdatedEvent['data'], msg: Message) {
        const ticket = await Ticket.findOne({
            _id: data.id,
            version: data.version - 1
        });
        if (!ticket) {
            throw new Error(`Ticket not found`);
        }

        const { title, price } = ticket;
        ticket.set({
            title,
            price
        });
        await ticket.save();

        msg.ack();
    }
}