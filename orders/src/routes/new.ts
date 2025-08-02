import { BadRequestError, OrderStatus, requireAuth, validateRequest } from "@xtptickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { Order } from "../models/order";
import { natsWrapper } from "../nats-wrapper";
import { Stan } from "node-nats-streaming";
import { IBusReservationCompleteEvent } from "@xtptickets/common";
import { BusReservationRequestPublisher } from "../events/publishers/bus-reservation-request-publisher";
import { BusReservationCompleteListener } from "../events/listeners/bus-reservation-complete-listener";

const router = express.Router();
/**
 * 15 * 60 คือ 900 วินาที = 15 นาที
 * นี่คือ "ช่วงเวลา (window of time)" ที่กำหนดให้หมดอายุภายหลัง 15 นาที
 */
const EXPIRATION_WINDOW_SECONDS = 1 * 60; // 1 นาที

router.post('/api/orders/', 
  requireAuth,
  [
    body("scheduleId").not().isEmpty().withMessage("Schedule ID is required"),
    body("tickets").isArray({ min: 1 }).withMessage("Tickets must be an array of one or more items"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { scheduleId, tickets: ticketInputs } = req.body;

    console.log('order comingggggg')
    console.log(scheduleId, ticketInputs);

    // 1. สร้าง Order ชั่วคราวในสถานะ "AwaitingReservation"
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.AwaitingReservation,
      expiresAt: expiration,
      tickets: [], // ยังไม่มีข้อมูลตั๋ว
      totalAmount: 0,
    });
    console.log("🚀 ~ order temp:", order)
    await order.save();

    // 2. สร้าง Promise ที่จะรอ "คำตอบ" จาก Bus Service
    const reservationPromise = new Promise((resolve, reject) => {
      // สร้าง Listener ชั่วคราวขึ้นมาเพื่อรอฟังคำตอบโดยเฉพาะ
      const listener = new BusReservationCompleteListener(natsWrapper.client, (result: IBusReservationCompleteEvent['data']) => {
        // สนใจเฉพาะ Event ที่มี orderId ตรงกับที่เราสร้าง เพราะ NATS จะ publish EVENTS ออกมาหลายๆ events
        if (result.orderId === order.id) {
          listener.close(); // ปิดการดักฟังเมื่อได้รับคำตอบที่ถูกต้อง
          if (result.success) {
            resolve(result.schedule); // ส่งข้อมูล Snapshot กลับไป
          } else {
            reject(new BadRequestError(result.errorMessage || 'Reservation failed'));
          }
        }
      });
      listener.listen();
      // ตั้งเวลา Timeout หากไม่ได้รับคำตอบใน 5 วินาที
      setTimeout(() => {
        listener.close();
        reject(new Error('Reservation request timed out'));
      }, 5000);
    });

    // 3. ส่ง Event "ร้องขอ" การจองที่นั่งไปยัง Bus Service
    await new BusReservationRequestPublisher(natsWrapper.client).publish({
      scheduleId,
      seat: ticketInputs.map((t: any) => t.seatNumber),
      orderId: order.id,
      version: order.version
    });

    try {
      // 4. รอผลลัพธ์จาก Promise (รอจนกว่า Bus Service จะตอบกลับ)
      const scheduleSnapshot: any = await reservationPromise;

      // 5. ถ้าสำเร็จ, อัปเดต Order ด้วยข้อมูล Snapshot ที่ถูกต้อง
      const ticketsData = ticketInputs.map((t: any) => ({
        scheduleId: scheduleSnapshot.id,
        busId: scheduleSnapshot.busId,
        origin: scheduleSnapshot.origin,
        destination: scheduleSnapshot.destination,
        departureTime: scheduleSnapshot.departureTime,
        seatNumber: t.seatNumber,
        passengerName: t.passengerName,
        price: scheduleSnapshot.price
      }));
      console.log("🚀 ~ ticketsData:", ticketsData);

      order.set({
        status: OrderStatus.Created,
        tickets: ticketsData,
        totalAmount: ticketsData.reduce((sum: any, t: { price: any; }) => sum + t.price, 0)
      });
      console.log("🚀 ~ order:", order)
      await order.save();

      res.status(201).send(order);

    } catch (err) {
      // 6. ถ้าล้มเหลว (ที่นั่งไม่ว่าง หรือ Timeout), ยกเลิก Order นี้
      order.set({ status: OrderStatus.Cancelled });
      await order.save();
      throw err; // ส่ง Error กลับไปให้ Frontend
    }
  });

export { router as newOrderRouter };
