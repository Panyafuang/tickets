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

    try {
      // สร้าง Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: order.price * 100, // จำนวนเงินเป็นหน่วยที่เล็กที่สุด (สตางค์สำหรับ THB)
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
      amount: order.price * 100,
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
