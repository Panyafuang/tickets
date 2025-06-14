import { IOrderCreatedEvent, OrderStatus } from "@xtptickets/common";
import mongoose from "mongoose";
import { Ticket } from "../../../model/ticket";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCreatedListener } from "../order-created-listener";

const setup = async () => {
  // 1. create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // 2. create and save a ticket
  const ticket = Ticket.build({
    title: "concert lisa",
    price: 99,
    userId: "abc123",
  });
  await ticket.save();

  // 3. create the fake data event
  const data: IOrderCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: "zxy123",
    expiresAt: "time_mock",
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, data, msg };
};

it("sets the orderId of the ticket", async () => {
  const { listener, ticket, msg, data } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.orderId).toEqual(data.id);
});

it("acks the message", async () => {
  const { listener, ticket, msg, data } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});


it("publishes a ticket updated event", async () => {
  const { listener, ticket, msg, data } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // @ts-ignore
  console.log(natsWrapper.client.publish.mock.calls);

  // Tell typscript publish is mock func.
  const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

  expect(data.id).toEqual(ticketUpdatedData.orderId);
});