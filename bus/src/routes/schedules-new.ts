import { NotFoundError, requireAdmin, requireAuth, validateRequest } from "@xtptickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { Route } from "../models/route";
import { BusSchedule } from "../models/bus-schedule";
import { BusScheduleCreatedPublisher } from "../events/publishers/bus-schedule-created-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

router.post(
  "/api/bus/schedules",
  requireAuth,
  requireAdmin,
  [
    body("routeId").not().isEmpty().withMessage("Route ID is required"),
    body('busId').not().isEmpty().withMessage('Bus ID is required'),
    body("departureTime")
      .isISO8601()
      .withMessage("Departure time must be a valid date"),
    body("arrivalTime")
      .isISO8601()
      .withMessage("Arrival time must be a valid date"),
    body("price").isFloat({ gt: 0 }).withMessage("Price must be greater than 0"),
    body("totalSeats")
      .isInt({ gt: 0 })
      .withMessage("Total seats must be an integer greater than 0"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { routeId, busId, departureTime, arrivalTime, price, totalSeats } = req.body;

    // 1. ตรวจสอบว่า Route ID มีอยู่จริง
    const route = await Route.findById(routeId);
    if (!route) {
      throw new NotFoundError();
    }

    // 2. สร้างผังที่นั่งเริ่มต้น
    const seatLayout = BusSchedule.initializeSeats(totalSeats);

    const schedule = BusSchedule.build({
      routeId: routeId,
      busId: busId,
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      price: price,
      totalSeats: totalSeats,
      availableSeats: totalSeats,
      seatLayout: seatLayout
    });
    await schedule.save();

    // Publish event
    await new BusScheduleCreatedPublisher(natsWrapper.client).publish({
      id: schedule.id,
      routeId: schedule.routeId.toString(),
      departureTime: schedule.departureTime.toISOString(),
      price: schedule.price,
      version: schedule.version
    });

    res.status(201).send(schedule);
  });


export { router as createBusScheduleRouter };