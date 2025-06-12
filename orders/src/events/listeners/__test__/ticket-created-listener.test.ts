import { ITicketCreatedEvent } from "@xtptickets/common";
import { natsWrapper } from "../../../nats-wrapper"
import { TicketCreatedListener } from "../ticket-created-listener"
import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";




const setup = async () => {
    // 1. create an instance of the listener
    const listener = new TicketCreatedListener(natsWrapper.client);

    // 2. create a face data event
    const data: ITicketCreatedEvent['data'] = {
        version: 0,
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert lisa',
        price: 100,
        userId: new mongoose.Types.ObjectId().toHexString()
    }

    // 3. create a face message obj.
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg };
}


it('creates and save a ticket', async() => {
    const { listener, data, msg } = await setup();

    // 1. call the onMessage func with the data obj. + message obj.
    await listener.onMessage(data, msg);

    // 2. write assertions to make sure a ticket was created
    const ticket = await Ticket.findById(data.id);

    expect(ticket).toBeDefined();
    expect(ticket!.title).toEqual(data.title);
    expect(ticket!.price).toEqual(data.price);
});

it('acks the message', async() => {
    const { listener, data, msg } = await setup();

    // 1. call the onMessage func with the data obj. + message obj.
    await listener.onMessage(data, msg);

    // 2. write assertions to make sure ack func is called
    expect(msg.ack).toHaveBeenCalled();
});