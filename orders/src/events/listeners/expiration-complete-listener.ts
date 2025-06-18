import { Subjects, Listener, IExpirationCompleteEvent, OrderStatus } from "@xtptickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { OrderCancelledPublisher } from "../publishers/order-cancelled-publisher";
import { natsWrapper } from "../../nats-wrapper";



export class ExpirationCompleteListener extends Listener<IExpirationCompleteEvent> {
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
    queueGroupName: string = queueGroupName;

    async onMessage(data: IExpirationCompleteEvent['data'], msg: Message) {
        const order = await Order.findById(data.orderId).populate('ticket');

        if (!order) {
            throw new Error('Order not found');
        }

        order.set({
            status: OrderStatus.Cancelled,
            // ticket: null --> ไม่ต้องกำนหดเป็น null เพราะถ้าอนาคตอยากดูว่า tickets อะไรที่ user cancelled ก็สามารถกลับมาดูได้ อีกอย่างเรามี method ที่ชื่อ isReserved ใน orders/src/models/ticket.ts ไว้เช็คอยู่แล้ว
        });
        await order.save();

        /**
         * await just to make sure we wait fot this thing to be published before finally acting or acknowledging the overall message.
         */
        await new OrderCancelledPublisher(natsWrapper.client).publish({
            id: order.id,
                version: order.version,
                ticket: {
                    id: order.ticket.id
                }
        });

        msg.ack();
    }
}