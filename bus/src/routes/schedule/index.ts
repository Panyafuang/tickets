import { validateRequest } from "@xtptickets/common";
import express, { Request, Response } from "express";
import { query } from "express-validator";
import { Route } from "../../models/route";
import { BusSchedule } from "../../models/bus-schedule";
const router = express.Router();

router.get(
  "/api/bus/schedules",
  [
    // ตรวจสอบ Query Parameters
    query("origin").not().isEmpty().withMessage("Origin is required"), // ต้นทาง
    query("destination").not().isEmpty().withMessage("Destination is required"), // ปลายทาง
    query("date")
      .isISO8601()
      .withMessage("Date must be a valid date (YYYY-MM-DD)"), // วันเดินทาง
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { origin, destination, date } = req.query;

    console.log('origin: ', origin);
    console.log('destination: ', destination);
    console.log('date: ', date);


    // 1. ค้นหา Route ID ที่ตรงกับ origin และ destination
    const route = await Route.findOne({
        origin: origin,
        destination: destination
    });

    if (!route) {
        // ถ้าไม่พบเส้นทาง ก็คืนค่าว่างไป
        return res.send([]);
    }

    // 2. คำนวณช่วงเวลาของวันที่ต้องการค้นหา
    const searchDate = new Date(date as string);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    // 3. ค้นหา BusSchedules ที่ตรงกับ Route ID และอยู่ในช่วงเวลาของวันนั้น
    const schedules = await BusSchedule.find({
        routeId: route.id,
        departureTime: { // เวลาออกเดินทาง
            $gte: startOfDay,
            $lte: endOfDay
        },
        isCancelled: false
    });

    res.send(schedules);
  }
);


export { router as listBusSchedulesRouter };
