import { NotFoundError } from '@xtptickets/common';
import express, { Request, Response } from 'express';
import { BusSchedule } from '../../models/bus-schedule';
import { Route } from '../../models/route';

const router = express.Router();

router.get('/api/bus/schedules/:id', async (req: Request, res: Response) => {
  const schedule = await BusSchedule.findById(req.params.id);
  if (!schedule) {
    throw new NotFoundError();
  }

  // ดึงข้อมูล Route มาแนบเพื่อเอาชื่อต้นทาง/ปลายทาง
  const route = await Route.findById(schedule.routeId);
  // นำข้อมูล schedule และ route มารวมกันก่อนส่งกลับไป
  const scheduleWithRouteInfo = {
    ...schedule.toJSON(), // เมธอด .toJSON() เป็นฟังก์ชันที่ Mongoose เตรียมไว้ให้โดยเฉพาะเพื่อ แปลง Mongoose Document ให้กลายเป็น Plain JavaScript Object ที่สะอาด ซึ่งจะเหลือแค่ข้อมูลจากฟิลด์ต่างๆ ใน Schema ของคุณเท่านั้น (เช่น id, routeId, busId, price)
    origin: route?.origin,
    destination: route?.destination
  }
  
  res.send(scheduleWithRouteInfo);
});

export { router as showBusScheduleRouter };