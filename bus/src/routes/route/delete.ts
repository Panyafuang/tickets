import {
  BadRequestError,
  NotFoundError,
  requireAdmin,
  requireAuth,
} from "@xtptickets/common";
import express, { Request, Response } from "express";
import { BusSchedule } from "../../models/bus-schedule";
import { Route } from "../../models/route";

const router = express.Router();

router.delete(
  "/api/bus/routes/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const existingRoute = await Route.findById(req.params.id);
    
    if (!existingRoute) {
      throw new NotFoundError();
    }

    // !! สำคัญ: ตรวจสอบก่อนว่ามี BusSchedule ใดๆ ใช้ Route นี้อยู่หรือไม่
    const scheduleUsingRoute = await BusSchedule.findOne({
      routeId: req.params.id,
    });
    if (scheduleUsingRoute) {
      throw new BadRequestError(
        "Cannot delete this route because it is currently in use by a schedule."
      );
    }

    await Route.findByIdAndDelete(req.params.id);
    res.status(204).send();
  }
);


export { router as deleteRouteRouter };