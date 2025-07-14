import { requireAdmin, requireAuth } from "@xtptickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";

const router = express.Router();

router.post("/api/bus/schedules", requireAuth, requireAdmin, [
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
]);
