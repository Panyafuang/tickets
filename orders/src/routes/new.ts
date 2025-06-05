import { BadRequestError, NotFoundError, OrderStatus, requireAuth, validateRequest } from "@xtptickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import mongoose from "mongoose";
import { Ticket } from "../models/ticket";
import { Order } from "../models/order";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();
/**
 * 15 * 60 คือ 900 วินาที = 15 นาที
 * นี่คือ "ช่วงเวลา (window of time)" ที่กำหนดให้หมดอายุภายหลัง 15 นาที
 */
const EXPIRATION_WINDOW_SECONDS = 15 * 60;

router.post(
  "/api/orders/",
  requireAuth,
  [
    body("ticketId")
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("TicketId must be provided"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    /** 1. Find the ticket the user trying to order in DB. */ 
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    /**
     * 2. Make sure that ticket is not already reserved.
     * -- Criterial --
     * - Run query to look all orders. Find an order where order.ticket = the ticket we just found (ข้อ 1).
     * - The order status is not cancelled.
     * - If we find an order from that means the ticket is reserved.
     */
    const isReserved = await ticket.isReserved();
    if (isReserved) {
      throw new BadRequestError('Ticket is already reserved');
    }

    /** 3. Calculate an expiration date for this order. 
     * expiration.getSeconds() ได้ "วินาที" ของเวลาปัจจุบัน (เช่น 12 ถ้าเป็น 14:01:12) 
     * แล้วบวกด้วย EXPIRATION_WINDOW_SECONDS (900 วินาที) 
     * จากนั้น setSeconds(...) จะตั้งเวลาใหม่ โดยรวมวินาทีทั้งหมด 
     * 📌 Date object จะจัดการเรื่องนาที/ชั่วโมงให้เอง ถ้าเกิน 60 วินาที 
     * ผลลัพธ์สุดท้าย: expiration กลายเป็นวันที่เวลาที่อยู่ห่างจากตอนนี้ไป 15 นาทีพอดี
    */
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    /** 4. Build the order and save to DB. */
    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expiration,
      ticket
    });
    await order.save();

    /** 5. Publish an event an order was created. (Back to common model, and create event)  */
    new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      status: order.status,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(),
      ticket: {
        id: ticket.id,
        price: ticket.price
      }
    });
    
    res.status(201).send(order);
  }
);

export { router as newOrderRouter };
