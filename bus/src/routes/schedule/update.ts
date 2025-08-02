import {
  BadRequestError,
  NotFoundError,
  requireAdmin,
  requireAuth,
  validateRequest,
} from "@xtptickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { BusSchedule } from "../../models/bus-schedule";
import { BusScheduleUpatedPublisher } from "../../events/publishers/bus-schedule-updated-publisher";
import { natsWrapper } from "../../nats-wrapper";

const router = express.Router();

router.put(
  "/api/bus/schedules/:id",
  requireAuth,
  requireAdmin,
  [
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0"),
    body("departureTime")
      .isISO8601()
      .withMessage("Departure time must be a valid date"),
    body("arrivalTime")
      .isISO8601()
      .withMessage("Arrival time must be a valid date"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { departureTime, arrivalTime, price, totalSeats } = req.body;

    const schedule = await BusSchedule.findById(req.params.id);

    if (!schedule) {
      throw new NotFoundError();
    }

    // --- ตรวจสอบที่สำคัญ ---
    // ป้องกันการแก้ไขเที่ยวรถ ในขณะที่กำลังมีคนพยายามจองอยู่
    const isLocked = schedule.seatLayout.some(seat => seat.status === 'locked');
    if (isLocked) {
      throw new BadRequestError('Cannot edit schedule while it has a pending reservation');
    }


    // อัปเดตเฉพาะ field ที่อนุญาตให้แก้ได้ เช่น ราคา หรือ เวลา
    schedule.set({
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      price: price
    });
    // บันทึกการเปลี่ยนแปลงลงฐานข้อมูล
    // Mongoose-update-if-current จะจัดการเรื่อง version ให้โดยอัตโนมัติ
    await schedule.save();

    // Publish event
    await new BusScheduleUpatedPublisher(natsWrapper.client).publish({
        id: schedule.id,
        version: schedule.version,
        routeId: schedule.routeId.toString(),
        departureTime: schedule.departureTime.toISOString(),
        price: schedule.price,
        isCancelled: schedule.isCancelled,
        availableSeats: schedule.availableSeats
    });
    res.send(schedule);
  }
);


export { router as updateBusScheduleRouter }