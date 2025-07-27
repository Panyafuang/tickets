import { Publisher, Subjects, IBusReservationRequestEvent } from "@xtptickets/common";


/**
 * Publisher สำหรับส่ง Event ร้องขอการจองที่นั่ง
 * จะถูกเรียกใช้โดย newOrderRouter
 */
export class BusReservationRequestPublisher extends Publisher<IBusReservationRequestEvent> {
    readonly subject: Subjects.BusReservationRequest = Subjects.BusReservationRequest;
}