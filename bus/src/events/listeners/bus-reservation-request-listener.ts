import { IBusReservationRequestEvent, Listener, Subjects } from "@xtptickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { BusSchedule } from "../../models/bus-schedule";


export class BusReservationRequestListener extends Listener<IBusReservationRequestEvent> {
    subject: Subjects.BusReservationRequest = Subjects.BusReservationRequest;
    queueGroupName = queueGroupName;

    async onMessage(data: IBusReservationRequestEvent['data'], msg: Message) {
        const { scheduleId, seat, orderId } = data;
        const schedule = await BusSchedule.findById(scheduleId);
        
    }
}