import { Listener, IOrderCreatedEvent, Subjects } from "@xtptickets/common";
import { queueGroupName } from "./queuq-group-name";
import { Message } from "node-nats-streaming";
import { expirationQueue } from "../../queues/expiration-queue";

export class OrderCreatedListener extends Listener<IOrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
    queueGroupName: string = queueGroupName;

    async onMessage(data: IOrderCreatedEvent['data'], msg: Message) {
        // 15 นาทีในอนาคต - เวลาปัจจุบัน = เวลาที่ต้องการ delay
        // คำนวณเวลาหน่วง (delay) ที่จะให้ Job ทำงาน
        const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
        console.log("🚀 ~ OrderCreatedListener ~ onMessage ~ delay:", delay / 1000);
        console.log(`Waiting ${delay} milliseconds to process the job for order: ${data.id}`);
        
        /**
         * 📥 เพิ่ม job ลงใน queue 
         * 🔥 Bull จะเก็บ job นี้ไว้ใน Redis เพื่อรอให้ worker ดึงไปประมวลผล
         * // Job นี้จะถูกประมวลผลหลังจากเวลาผ่านไปเท่ากับค่า delay
         */
        await expirationQueue.add({
            orderId: data.id
        },{
            delay
        });

        msg.ack();
    }
} 