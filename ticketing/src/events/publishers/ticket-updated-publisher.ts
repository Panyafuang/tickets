import { ITicketUpdatedEvent, Publisher, Subjects } from '@xtptickets/common';


export class TicketUpdatedPublisher extends Publisher<ITicketUpdatedEvent> {
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}