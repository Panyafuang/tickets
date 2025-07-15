import { Subjects, Publisher, IBusScheduleUpdatedEvent } from "@xtptickets/common";

export class BusScheduleUpatedPublisher extends Publisher<IBusScheduleUpdatedEvent> {
    readonly subject: Subjects.BusScheduleUpdated = Subjects.BusScheduleUpdated;
}