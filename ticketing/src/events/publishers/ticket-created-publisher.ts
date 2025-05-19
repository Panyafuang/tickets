import { ITicketCreatedEvent, Publisher, Subjects } from '@xtptickets/common';


export class TicketCreatedPublisher extends Publisher<ITicketCreatedEvent> {
    subject: Subjects.TicketCreated = Subjects.TicketCreated;
}