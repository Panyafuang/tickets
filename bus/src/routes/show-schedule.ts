import { NotFoundError } from '@xtptickets/common';
import express, { Request, Response } from 'express';
import { BusSchedule } from '../models/bus-schedule';

const router = express.Router();

router.get('/api/bus/schedules/:id', async (req: Request, res: Response) => {
  const schedule = await BusSchedule.findById(req.params.id);

  if (!schedule) {
    throw new NotFoundError();
  }

  res.send(schedule);
});

export { router as showBusScheduleRouter };