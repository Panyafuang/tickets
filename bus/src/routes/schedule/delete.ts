 import { BadRequestError, NotFoundError, requireAdmin, requireAuth } from '@xtptickets/common';
import express, { Request, Response } from 'express';
import { BusSchedule } from '../../models/bus-schedule';
import { BusScheduleUpatedPublisher } from '../../events/publishers/bus-schedule-updated-publisher';
import { natsWrapper } from '../../nats-wrapper';


 const router = express.Router();



 router.put('/api/bus/schedule/cancel/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const schedule = await BusSchedule.findById(req.params.id);

    if (!schedule) {
        throw new NotFoundError();
    }

    // ป้องกันการยกเลิกซ้ำ
    if (schedule.isCancelled) {
        throw new BadRequestError('This schedule has already been cancelled.');
    }

    if (schedule.availableSeats < schedule.totalSeats) {
        throw new BadRequestError('Cannot delete schedule with existing bookings.');
    }

    schedule.set({ isCancelled: true });
    await schedule.save();

    // Publish event 'busSchedule:updated' เพื่อแจ้งให้ Service อื่นทราบ ว่ามีการอัปเดตเกิดขึ้น (สถานะ isCancelled เปลี่ยนไป)
    new BusScheduleUpatedPublisher(natsWrapper.client).publish({
        id: schedule.id,
        version: schedule.version,
        price: schedule.price,
        routeId: schedule.routeId.toString(),
        departureTime: schedule.departureTime.toISOString(),
        isCancelled: schedule.isCancelled, // ส่งสถานะใหม่ไปด้วย
        availableSeats: schedule.availableSeats
    });


    res.status(204).send();
 });

 export { router as cancelBusScheduleRouter }