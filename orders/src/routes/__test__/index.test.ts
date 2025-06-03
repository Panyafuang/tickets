import { Ticket } from "../../models/ticket";
import request from "supertest";
import { app } from '../../app';

const buildTicket = async () => {
    const ticket = Ticket.build({
        title: 'concert_mock',
        price: 220
    });
    await ticket.save();
    return ticket;
}

it('fetches orders for an particular user', async () => {
    // 1. Create 3 tickets
    const ticket1 = await buildTicket();
    const ticket2 = await buildTicket();
    const ticket3 = await buildTicket();

    // 2. Create 1 order as User #1
    const user1 = global.signin();
    const user2 = global.signin();
    await request(app)
        .post('/api/orders')
        .set('Cookie', user1)
        .send({ ticketId: ticket1.id })
        .expect(201)

    // 3. Create 2 orders as User #2
    const { body: order1 } = await request(app)
        .post('/api/orders')
        .set('Cookie', user2)
        .send({ ticketId: ticket2.id })
        .expect(201)
    const { body: order2 } = await request(app)
        .post('/api/orders')
        .set('Cookie', user2)
        .send({ ticketId: ticket3.id })
        .expect(201)


    // 4. Make request to get orders for User #2
    const response = await request(app)
        .get('/api/orders')
        .set('Cookie', user2)
        .expect(200);

    // 5. Make sure we only got the orders for User #2
    console.log(order1);
    expect(response.body.length).toEqual(2);
    expect(response.body[0].id).toEqual(order1.id);
    expect(response.body[1].id).toEqual(order2.id);
});