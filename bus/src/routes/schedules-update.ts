import { NotFoundError, requireAdmin, requireAuth, validateRequest } from '@xtptickets/common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { BusSchedule } from '../models/bus-schedule';


const router = express.Router();

router.put(
    '/api/bus/schedules/:id',
    requireAuth,
    requireAdmin,
    [
        body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
        body("departureTime")
            .isISO8601()
            .withMessage("Departure time must be a valid date")
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const schedule = await BusSchedule.findById(req.params.id);

        if (!schedule) {
            throw new NotFoundError();
        }

        // อัปเดตเฉพาะ field ที่อนุญาตให้แก้ได้ เช่น ราคา หรือ เวลา
    }
)