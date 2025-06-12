import mongoose from "mongoose";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";
import { TicketUpdatedListener } from "../ticket-updated-listern"
import { ITicketUpdatedEvent } from "@xtptickets/common";

const setup = async () => {
    // 1. create a listener
    const listener = new TicketUpdatedListener(natsWrapper.client);

    // 2. create and save a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert lisa',
        price: 100
    });
    await ticket.save();

    // 3. create a fake data obj. (the thing that describes some update to our ticket)
    const data: ITicketUpdatedEvent['data'] = {
        id: ticket.id,
        version: ticket.version + 1,
        title: 'new concert',
        price: 999,
        userId: '123acb'
    }

    // 4. create a fake msg obj.
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    // 5. return all of this stuff
    return { listener, data, msg };
}