import { Subjects, Listener, ITicketUpdatedEvent } from "@xtptickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../models/ticket";



export class TicketUpdatedListener extends Listener<ITicketUpdatedEvent> {
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
    queueGroupName: string = queueGroupName;


    async onMessage(data: ITicketUpdatedEvent['data'], msg: Message) {
        const ticket = await Ticket.findByEvent(data);
        console.log("🚀 ~ TicketUpdatedListener ~ onMessage ~ data:", data)
        console.log("🚀 ~ TicketUpdatedListener ~ onMessage ~ ticket:", ticket)
        
        if (!ticket) {
            throw new Error(`Ticket not found`);
        }

        const { title, price, version } = data;
        ticket.set({
            title,
            price,
            version
        });
        await ticket.save();

        msg.ack();
    }
}