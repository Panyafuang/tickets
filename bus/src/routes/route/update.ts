import {
  NotFoundError,
  requireAdmin,
  requireAuth,
  validateRequest,
} from "@xtptickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { Route } from "../../models/route";

const router = express.Router();

router.put(
  "/api/bus/routes/:id",
  requireAuth,
  requireAdmin,
  [
    body("origin").not().isEmpty().withMessage("Origin is required"),
    body("destination").not().isEmpty().withMessage("Destination is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const route = await Route.findById(req.params.id);

    if (!route) {
      throw new NotFoundError();
    }

    const { origin, destination, distanceKm, durationHours } = req.body;
    route.set({
      origin,
      destination,
      distanceKm,
      durationHours,
    });
    await route.save();

    res.send(route)
  }
);


export { router as updateRouteRouter }