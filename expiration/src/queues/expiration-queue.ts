import Queue from 'bull';
import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher';
import { natsWrapper } from '../nats-wrapper';

interface Payload {
    orderId: string;
}
/**
 * 📬 สร้างคิวชื่อ send-email ซึ่งเอาไว้เก็บงานที่เกี่ยวข้องกับการส่งอีเมล 🔗 และเชื่อมต่อกับ Redis 
 */
const expirationQueue = new Queue<Payload>('order:expiration', {
    redis: {
        host: process.env.REDIS_HOST
    }
});

/**
 * 👨‍🏭 ประกาศ worker เพื่อดึง job ออกมาทำงาน โดย:
 * - job.data คือข้อมูลที่เราใส่ไว้ตอน .add()
 * 💡 หมายเหตุ: ฟังก์ชัน process() จะทำงานเรื่อย ๆ แบบอัตโนมัติ เมื่อมี job ใหม่เข้ามา
 */
expirationQueue.process(async (job) => {
    new ExpirationCompletePublisher(natsWrapper.client).publish({
        orderId: job.data.orderId
    });
});

export { expirationQueue };