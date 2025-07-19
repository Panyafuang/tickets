import express, { Request, Response } from "express";
import { Route } from "../../models/route";
import { BusSchedule } from "../../models/bus-schedule";
const router = express.Router();

router.get(
  "/api/bus/schedules/list",
  async (req: Request, res: Response) => {
    const schedules = await BusSchedule.find({});
    res.send(schedules);
  }
);


export { router as listBusSchedulesRouter };
