import mongoose from "mongoose";
import { Ticket } from "../../../models/ticket"
import { Order, OrderStatus } from "../../../models/order";
import { IExpirationCompleteEvent } from "@xtptickets/common";
import { Message } from "node-nats-streaming";
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { natsWrapper } from "../../../nats-wrapper";


const setup = async () => {
    const listener = new ExpirationCompleteListener(natsWrapper.client);

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 200
    });
    await ticket.save();

    const order = Order.build({
        status: OrderStatus.Created,
        userId: 'abc123',
        expiresAt: new Date(),
        ticket
    });
    await order.save();

    const data: IExpirationCompleteEvent['data'] = {
        orderId: order.id
    }
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return {
        listener,
        order,
        ticket,
        data,
        msg
    }
}

it('updates the order status to cancelled', async () => {
    const { listener, order, ticket, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(data.orderId);
    expect(updatedOrder?.status).toEqual(OrderStatus.Cancelled);
});

it('emit an OrderCancelled event', async () => {
    const { listener, order, ticket, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);
    expect(eventData.id).toEqual(order.id);
});

it('ack the message', async () => {
    const { listener, order, ticket, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});