import mongoose from "mongoose";
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from "../../models/ticket";
import { Order, OrderStatus } from "../../models/order";

it('returns an error if the ticket does not exist', async () => {
    const ticketId = new mongoose.Types.ObjectId();

    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId })
        .expect(404)
});

it('returns an error if the ticket is already reserved', async () => {
    /**
     * 1. สร้าง ticket -> save DB.
     * 2. สร้าง order(ข้างในมีรายละเอียด ticket) -> save DB.
     * 3. make sure that the order and the ticket are associated with each other. (ถ้าใช้ก็คือ ticket นี่ถูกจองแล้ว)
     */

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert_mock',
        price: 220
    });
    await ticket.save();

    const order = Order.build({
        ticket,
        userId: 'abc123',
        status: OrderStatus.Created,
        expiresAt: new Date()
    });
    await order.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId: ticket.id })
        .expect(400);
});

it('reserves a ticket', async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert_mock',
        price: 220
    });
    await ticket.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', global.signin())
        .send({ ticketId: ticket.id })
        .expect(201);
});

it.todo('emit on order created event');