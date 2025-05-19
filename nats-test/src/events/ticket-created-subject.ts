import { Publisher } from "./base-publisher";
import { Subjects } from "./subjects";
import { ITicketCreatedEvent } from "./ticket-created-event";



export class TicketCreatedPublisher extends Publisher<ITicketCreatedEvent> {
    subject: Subjects.TicketCreated = Subjects.TicketCreated;

    /**
     * We do not have to defind published function here. because we already definde inside the publisher base class.
     */
}