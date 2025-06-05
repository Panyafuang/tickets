import { IOrderCreatedEvent, Publisher, Subjects } from "@xtptickets/common";

export class OrderCreatedPublisher extends Publisher<IOrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;

}