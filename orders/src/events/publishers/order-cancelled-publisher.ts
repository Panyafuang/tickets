import { IOrderCancelledEvent, Publisher, Subjects } from "@xtptickets/common";

export class OrderCancelledPublisher extends Publisher<IOrderCancelledEvent> {
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}