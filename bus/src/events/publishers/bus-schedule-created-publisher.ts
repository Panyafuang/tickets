import { Publisher, Subjects, IBusScheduleCreatedEvent } from "@xtptickets/common";

export class BusScheduleCreatedPublisher extends Publisher<IBusScheduleCreatedEvent> {
    readonly subject: Subjects.BusScheduleCreated = Subjects.BusScheduleCreated;
}