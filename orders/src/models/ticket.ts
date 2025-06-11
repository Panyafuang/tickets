import mongoose from "mongoose";
import { Order, OrderStatus } from "./order";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface ITicketAttrs {
    id: string;
    title: string;
    price: number;
}

export interface ITicketDoc extends mongoose.Document {
    title: string;
    price: number;
    version: number;
    isReserved(): Promise<boolean>;
}

interface ITicketModel extends mongoose.Model<ITicketDoc> {
    build(attrs: ITicketAttrs): ITicketDoc;

    /** Find by ticketId and previous version */
    findByEvent(event: {id: string, version: number }): Promise<ITicketDoc | null>;
}


const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});


ticketSchema.set('versionKey', 'version');
ticketSchema.plugin(updateIfCurrentPlugin);


ticketSchema.statics.build = (attrs: ITicketAttrs) => {
    return new Ticket({
        _id: attrs.id,
        title: attrs.title,
        price: attrs.price
    });
}

ticketSchema.methods.isReserved = async function () {
    /**
     * 2. Make sure that ticket is not already reserved.
     * -- Criterial --
     * - Run query to look all orders. Find an order where order.ticket = the ticket we just found (ข้อ 1).
     * - The order status is not cancelled.
     * - If we find an order from that means the ticket is reserved.
     */
    // this ใน method นี่คือ the ticket document that we just called 'isReserved'
    // existingOrder = just orders someone else created.
    const existingOrder = await Order.findOne({
        ticket: this,
        status: {
            $in: [
                OrderStatus.Created, 
                OrderStatus.AwaitingPayment, 
                OrderStatus.Complete
            ]
        }
    });

    return !!existingOrder;
}

/**
 * สร้าง Mongoose model ชื่อ Ticket โดยใช้ schema ticketSchema และบอก TypeScript ว่า:
    - document ที่ return มาจาก model นี้ มีชนิด ITicketDoc
    - model นี้มี method ชื่อ build(...) ด้วย (จาก ITicketModel)
 */
const Ticket = mongoose.model<ITicketDoc, ITicketModel>('Ticket', ticketSchema);
export { Ticket };