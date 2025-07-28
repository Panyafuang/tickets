import { IBusReservationCompleteEvent, IBusReservationRequestEvent, Listener, Subjects } from "@xtptickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { BusSchedule } from "../../models/bus-schedule";
import { BusReservationCompletePublisher } from "../publishers/bus-reservation-complete-publisher";
import { natsWrapper } from "../../nats-wrapper";
import { BusScheduleUpatedPublisher } from "../publishers/bus-schedule-updated-publisher";
import { Route } from "../../models/route";


export class BusReservationRequestListener extends Listener<IBusReservationRequestEvent> {
    subject: Subjects.BusReservationRequest = Subjects.BusReservationRequest;
    queueGroupName = queueGroupName;

    async onMessage(data: IBusReservationRequestEvent['data'], msg: Message) {
        const { scheduleId, seat, orderId } = data;
        const schedule = await BusSchedule.findById(scheduleId);
        const route = await Route.findById(schedule?.routeId);
        let reply: IBusReservationCompleteEvent['data'];

        if (!schedule) {
            // กรณีไม่พบเที่ยวรถ
            reply = {
                orderId,
                success: false,
                errorMessage: 'Not found schedule'
            }

        } else if (!route?.origin || !route?.destination) {
            console.error('Schedule is missing origin or destination data', schedule);
            reply = { orderId, success: false, errorMessage: 'ข้อมูลเที่ยวรถไม่สมบูรณ์' };
        } else {
            /** กรณีพบเที่ยวรถ */
            // 1. ตรวจสอบว่าที่นั่งที่ต้องการจองยังว่างอยู่หรือไม่
            const unavailableSeats = seat.filter(seatNum => {
                const seat = schedule.seatLayout.find(s => s.seatNumber === seatNum);
                if (!seat || seat.status !== 'available') return true;
                // return !seat || seat.status !== 'available';
            });



            // 2. ถ้ามีที่นั่งไม่ว่าง, ส่งคำตอบว่า "ล้มเหลว"
            if (unavailableSeats.length > 0) {
                reply = { orderId, success: false, errorMessage: `ที่นั่ง ${unavailableSeats.join(', ')} ไม่ว่าง` };
            } else {
                // 3. ถ้าว่างทั้งหมด, ทำการล็อกที่นั่ง
                seat.forEach(seatNum => {
                    const seat = schedule.seatLayout.find(s => s.seatNumber === seatNum);
                    if (seat) {
                        seat.status = 'locked';
                        seat.orderId = orderId;
                    }
                });
                // calculate number of availableSeats AND save
                schedule.availableSeats = schedule.seatLayout.filter(s => s.status === 'available').length;

                try {
                    await schedule.save();
                    console.log("🚀 ~ BusReservationRequestListener ~ onMessage ~ schedule:", schedule)
                    console.log("route bus-srv findById schedule.routeId: ", route);

                    // 4. สร้าง Snapshot ของ Schedule เพื่อส่งข้อมูลที่ถูกต้องกลับไป
                    const scheduleSnapshot = {
                        id: schedule.id,
                        busId: schedule.busId,
                        origin: route?.origin,
                        destination: route?.destination,
                        price: schedule.price,
                        departureTime: schedule.departureTime,
                        version: schedule.version
                    }
                    console.log("🚀 ~ BusReservationRequestListener ~ onMessage ~ scheduleSnapshot:", scheduleSnapshot)
                    reply = {
                        orderId: orderId,
                        success: true,
                        schedule: scheduleSnapshot
                    }

                    // 5. Publish event แจ้งว่าข้อมูล schedule มีการอัปเดต (ที่นั่งว่างลดลง)
                    await new BusScheduleUpatedPublisher(natsWrapper.client).publish({
                        id: schedule.id,
                        availableSeats: schedule.availableSeats,
                        version: schedule.version,
                        departureTime: schedule.departureTime.toISOString(),
                        routeId: route?.id,
                        price: schedule.price,
                        isCancelled: schedule.isCancelled
                    });
                } catch (err) {
                    // ถ้าเกิด VersionError (มีคนจองตัดหน้า) ให้ถือว่าการจองนี้ล้มเหลว
                    console.error('Concurrency error (VersionError) while saving schedule:', err);
                    reply = { orderId, success: false, errorMessage: 'ที่นั่งที่ท่านเลือกถูกจองไปแล้ว กรุณาลองใหม่อีกครั้ง' };
                }
            }
        }


        // 6. ส่ง Event "คำตอบ" กลับไป
        await new BusReservationCompletePublisher(natsWrapper.client).publish(reply)

        // 7. ยืนยันว่า Event นี้ถูกประมวลผลเรียบร้อยแล้ว
        msg.ack();
    }
}