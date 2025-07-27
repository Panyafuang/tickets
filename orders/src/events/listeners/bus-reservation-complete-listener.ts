import { Listener, IBusReservationCompleteEvent, Subjects } from "@xtptickets/common";
import { Message, Stan } from "node-nats-streaming";

// กำหนด Type ของ Callback function ที่จะรับผลลัพธ์
type Callback = (result: IBusReservationCompleteEvent['data']) => void;

/**
 * Listener พิเศษที่ถูกสร้างขึ้นมาชั่วคราวเพื่อรอรับ "คำตอบ" ที่เฉพาะเจาะจง
 * ใช้ Queue Group ที่ไม่ซ้ำกันเพื่อให้แน่ใจว่าจะได้รับข้อความ และใช้ Callback
 * เพื่อส่งผลลัพธ์กลับไปให้ Promise ที่รออยู่ใน Route Handler
 */
export class BusReservationCompleteListener extends Listener<IBusReservationCompleteEvent> {
    subject: Subjects.BusReservationComplete = Subjects.BusReservationComplete;
    // ใช้ Queue Group ที่ไม่ซ้ำกัน เพื่อให้ Listener ชั่วคราวนี้ได้รับข้อความแน่นอน
    queueGroupName: string = `orders-service-complete-${new Date().getTime()}`;
    private callback: Callback;
    subscription: any;

    constructor(client: Stan, callback: Callback) {
        super(client);
        this.callback = callback;
    }

    async onMessage(data: IBusReservationCompleteEvent['data'], msg: Message) {
        // เมื่อได้รับข้อความ ให้เรียก callback ที่ส่งมาจาก Route Handler
        this.callback(data);
        msg.ack();
    }

    // Method สำหรับปิดการ Subscribe เมื่อทำงานเสร็จ (สำคัญมาก!)
    close() {
        this.subscription.close();
        console.log(`Subscription closed for ${this.queueGroupName}`);
    }
}