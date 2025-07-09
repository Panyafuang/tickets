import { Listener, Subjects, IBusScheduleCreatedEvent } from '@xtptickets/common';
import { queueGroupName } from './queue-group-name';
import { Message } from 'node-nats-streaming';


export class BusScheduleCreatedLister extends Listener<IBusScheduleCreatedEvent> {
    readonly subject: Subjects.BusScheduleCreated = Subjects.BusScheduleCreated
    queueGroupName: string = queueGroupName

    async onMessage(data: IBusScheduleCreatedEvent['data'], msg: Message) {
        
    }
}