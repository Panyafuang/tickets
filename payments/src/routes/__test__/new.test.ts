import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app";
import { Order } from "../../models/order";
import { OrderStatus } from "@xtptickets/common";

/**
 * สำคัญ
 * Because we are mocking out the stripe module right here when we write out this import { stripe } from "../../stripe";
 * jest going to make sure that we get the stripe file inside of our __mocks__ folder, Not the real version of the stripe file.
 * 
 * หมายความว่า Jest จะไม่โหลดโค้ดจริงในไฟล์ stripe.ts หรือ stripe.js แต่จะพยายามหาไฟล์ mock ที่ชื่อเหมือนกันใน __mocks__/stripe.ts(หรือ .js)
 * เมื่อเรียก import { stripe } แบบนี้และมี jest.mock(...) ตามมา Jest จะมองหาไฟล์ __mocks__/stripe.ts ในโฟลเดอร์เดียวกับไฟล์ทดสอบ แล้วใช้ตัว mock แทนตัวจริงเลย
 * 
 * 
 */
import { stripe } from "../../stripe";
// jest.mock('../../stripe'); // เป็นคำสั่งของ Jest ที่สั่งให้ "mock" โมดูล ../../stripe



it("returns a 404 when purchasing an order that does not exist", async () => {
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "mock_token",
      orderId: new mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it("returns a 401 when purchasing an order that does not belong to the user", async () => {
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created,
  });
  await order.save();

  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "mock_token",
      orderId: order.id,
    })
    .expect(401);
});

it('returns a 400 when purchasing a cancelled order', async() => {
  const userId = new mongoose.Types.ObjectId().toHexString();

  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      orderId: order.id,
      token: 'mock_token'
    })
    .expect(400)
});

it('returns a 201 with valid inputs', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 100000);
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id
    })
    .expect(201);

    // const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
    // expect(chargeOptions.source).toEqual('tok_visa');
    // expect(chargeOptions.amount).toEqual(20 * 100);
    // expect(chargeOptions.currency).toEqual('thb');

    const stripeCharges = await stripe.charges.list({ limit: 50 });
    const stripeCharge = stripeCharges.data.find((charge) => {
      return charge.amount === price * 100;
    });
    console.log("🚀 ~ stripeCharge ~ stripeCharge:", stripeCharge)

    expect(stripeCharge).toBeDefined();
});