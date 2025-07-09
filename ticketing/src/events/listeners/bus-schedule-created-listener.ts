import { Listener, Subjects } from '@xtptickets/common';


export class BusScheduleCreatedLister extends Listener<IBusScheduleCreatedEvent> {
    readonly subject = Subjects.BusScheduleCreated
}