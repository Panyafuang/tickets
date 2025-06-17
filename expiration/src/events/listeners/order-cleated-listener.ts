import { Listener, IOrderCreatedEvent, Subjects } from "@xtptickets/common";
import { queueGroupName } from "./queuq-group-name";
import { Message } from "node-nats-streaming";
import { expirationQueue } from "../../queues/expiration-queue";

export class OrderCreatedListener extends Listener<IOrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
    queueGroupName: string = queueGroupName;

    async onMessage(data: IOrderCreatedEvent['data'], msg: Message) {
        // 15 นาทีในอนาคต - เวลาปัจจุบัน = เวลาที่ต้องการ delay
        const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
        console.log("🚀 ~ OrderCreatedListener ~ onMessage ~ delay:", delay / 1000);
        /**
         * 📥 เพิ่ม job ลงใน queue 
         * 🔥 Bull จะเก็บ job นี้ไว้ใน Redis เพื่อรอให้ worker ดึงไปประมวลผล
         */
        await expirationQueue.add({
            orderId: data.id
        },{
            delay
        });

        msg.ack();
    }
} 