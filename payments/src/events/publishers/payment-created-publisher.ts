import { Subjects, IPaymentCreatedEvent, Publisher } from "@xtptickets/common";

export class PaymentCreatedPublisher extends Publisher<IPaymentCreatedEvent> {
    subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}