import { Publisher, Subjects, IBusReservationCompleteEvent } from "@xtptickets/common";

export class BusReservationCompletePublisher extends Publisher<IBusReservationCompleteEvent> {
    readonly subject: Subjects.BusReservationComplete = Subjects.BusReservationComplete;
}