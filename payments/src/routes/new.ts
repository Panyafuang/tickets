import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
  requireAuth,
  validateRequest,
} from "@xtptickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { Order } from "../models/order";
import { stripe } from "../stripe";
import { Payment } from "../models/payment";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();
// 1. Endpoint สำหรับสร้าง Payment Intent
// promt pay
router.post(
  "/api/payments/create-payment-intent",
  requireAuth,
  [
    body("orderId").not().isEmpty().withMessage("Order ID must be provided")
    // ไม่จำเป็นต้องมี token หรือ email ตรงนี้ เพราะ PaymentIntent จะจัดการเอง
  ], validateRequest,
  async (req: Request, res: Response) => {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== req.currentUser?.id) {
      throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError("Cannot pay for an cancelled order"); // order expired
    }
    if (order.status === OrderStatus.Complete) {
      throw new BadRequestError("Order has already been paid");
    }

    try {
      // สร้าง Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: order.totalAmount * 100, // จำนวนเงินเป็นหน่วยที่เล็กที่สุด (สตางค์สำหรับ THB)
        currency: "thb", // <<< กำหนดสกุลเงินเป็น THB
        payment_method_types: ["card", "promptpay"], // <<< รองรับทั้ง Card และ PromptPay
        metadata: {
          orderId: order.id,
          userId: req.currentUser?.id,
          // ไม่ต้องมี userEmail ตรงนี้ก็ได้ ถ้าไม่จำเป็นต้องใช้ใน PaymentIntent โดยตรง
        },
        description: `Payment for Order ${order.id}`,
      });

      // ส่ง client_secret กลับไปยัง Frontend
      res.status(201).send({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id // ส่ง id ไปด้วยก็ได้
      });

    } catch (stripeError: any) {
      console.error("Stripe Payment Intent creation error:", stripeError);
      throw new BadRequestError(`Payment intent creation failed: ${stripeError.message}`);
    }
  }
);

// 2. Endpoint สำหรับรับ Webhook จาก Stripe (สำคัญมาก)
// ใช้ express.raw() เพื่อให้ได้ request body เป็น Buffer สำหรับการตรวจสอบ signature
router.post('/api/payments/stripe-webhook',
  express.raw(
    { type: 'application/json' }
  ),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    let event;
    try {
      // ใช้ Webhook secret key เพื่อตรวจสอบว่า request มาจาก Stripe จริง
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_KEY!);
    } catch (err: any) {
      console.error('Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // จัดการเฉพาะ Event 'payment_intent.succeeded'
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      // สร้าง Payment record
      const payment = Payment.build({
        orderId: orderId,
        stripeId: paymentIntent.id,
      });
      await payment.save();

      // Publish Event แจ้งว่าการชำระเงินสำเร็จ
      await new PaymentCreatedPublisher(natsWrapper.client).publish({
        id: payment.id,
        orderId: payment.orderId,
        stripeId: payment.stripeId,
      });

      console.log(`✅ Payment successful and confirmed for order: ${orderId}`);
    }
    res.status(200).send({ received: true }); // ตอบกลับ Stripe ว่าได้รับ Webhook แล้ว
  });



// credit card
router.post(
  "/api/payments",
  requireAuth,
  [body("token").not().isEmpty(), body("orderId").not().isEmpty()],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }
    // เช็คว่า order ที่จะชำระเงินเป็นของ user ที่ login อยู่ใช่ไหม
    if (order.userId !== req.currentUser?.id) {
      throw new NotAuthorizedError();
    }
    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError("Cannot pay for an cancelled order"); // order expired
    }

    const charge = await stripe.charges.create({
      currency: "thb",
      amount: order.totalAmount * 100,
      source: token,
      // คุณสามารถเพิ่มข้อมูล metadata ได้ที่นี่หากต้องการ
      metadata: {
        orderId: order.id,
        userEmail: req.currentUser.email,
        userId: req.currentUser?.id,
      },
      description: `Payment for Order ${order.id}`,
    });
    const payment = Payment.build({
      orderId,
      stripeId: charge.id,
    });
    await payment.save();

    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId,
    });

    res.status(201).send({ id: payment.id });
  }
);

export { router as createChargeRouter };
