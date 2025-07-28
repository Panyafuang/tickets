import { Listener, IBusReservationCompleteEvent, Subjects } from "@xtptickets/common";
import { Message, Stan, SubscriptionOptions } from "node-nats-streaming";

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

    // --- 1. เพิ่ม Property นี้เข้ามา ---
    // สร้างตัวแปร isClosed เพื่อติดตามสถานะ
    private isClosed = false;

    constructor(client: Stan, callback: Callback) {
        super(client);
        this.callback = callback;
    }

    /**
     * Override subscriptionOptions จาก Base Listener
     * สำหรับ Listener ชั่วคราว เราไม่ต้องการ Durable Subscription
     * เราต้องการให้มันเริ่มรับ Event ใหม่ทั้งหมดที่เข้ามาหลังจากที่มันเริ่มฟัง
     */
    subscriptionOptions(): SubscriptionOptions {
        return this.client
            .subscriptionOptions()
            .setManualAckMode(true)
            .setAckWait(this.ackWait)
            // การกำหนด Durable Name เป็นค่าว่าง คือหัวใจสำคัญ
            // ที่จะทำให้ Subscription นี้เป็นแบบชั่วคราวและรับเฉพาะ Event ใหม่เท่านั้น
            .setDurableName('');
    }

    async onMessage(data: IBusReservationCompleteEvent['data'], msg: Message) {
        // เมื่อได้รับข้อความ ให้เรียก callback ที่ส่งมาจาก Route Handler
        this.callback(data);
        msg.ack();
    }

    // Method สำหรับปิดการ Subscribe เมื่อทำงานเสร็จ (สำคัญมาก!)
    close() {
        // --- 2. แก้ไข Logic ในการปิด ---
        // ตรวจสอบก่อนว่ายังไม่เคยถูกปิด และ subscription มีอยู่จริง
        if (!this.isClosed && this.subscription) {
            this.isClosed = true; // ตั้งค่าสถานะเป็น "ปิดแล้ว" ทันที
            this.subscription.close();
            console.log(`Subscription closed for ${this.queueGroupName}`);
        }
    }
}