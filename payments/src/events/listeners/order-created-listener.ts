import { Subjects, IOrderCreatedEvent, Listener, OrderStatus } from "@xtptickets/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";


export class OrderCreatedLister extends Listener<IOrderCreatedEvent>{
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
    queueGroupName: string = queueGroupName;


    async onMessage(data: IOrderCreatedEvent['data'], msg: Message) {
        const order = Order.build({
            id: data.id, // orderId
            price: data.ticket.price,
            status: data.status,
            userId: data.userId,
            version: data.version
        });
        await order.save();

        msg.ack();
    }
}