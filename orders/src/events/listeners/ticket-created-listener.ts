import { ITicketCreatedEvent, Listener, Subjects } from "@xtptickets/common";
import { Message } from "node-nats-streaming";


export class TicketCreatedLister extends Listener<ITicketCreatedEvent> {
    subject: Subjects.TicketCreated = Subjects.TicketCreated;
    queueGroupName: string = 'orders-service';

    onMessage(data: ITicketCreatedEvent['data'], msg: Message): void {
        
    }
}