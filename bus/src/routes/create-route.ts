import { requireAuth, validateRequest } from "@xtptickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { Route } from "../models/route";

const router = express.Router();

router.post(
  "/api/bus/routes",
  requireAuth,
  [
    body("origin").not().isEmpty().withMessage("Origin is required"),
    body("destination").not().isEmpty().withMessage("Destination is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { origin, destination, distanceKm, durationHours } = req.body;

    const route = Route.build({
        origin,
        destination,
        distanceKm,
        durationHours,
    });
    await route.save();

    res.status(201).send(route);
  }
);


export { router as createRouteRouter };