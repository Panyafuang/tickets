import mongoose from "mongoose";
import { OrderStatus } from '@xtptickets/common';
import { ITicketDoc } from "./ticket";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
export { OrderStatus }

// Interface สำหรับข้อมูลของตั๋วแต่ละใบใน Order
interface ITicketInfo {
    scheduleId: string;
    busId: string;
    origin: string;
    destination: string;
    departureTime: Date;
    seatNumber: string;
    passengerName: string;
    price: number;
}

// Interface สำหรับข้อมูลตอนสร้าง Order
interface IOrderAttrs {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: ITicketInfo[]; // รับตั๋วเป็น Array
    totalAmount: number; // เพิ่มราคารวมของ Order
}

// Interface สำหรับ Order Document ใน DB
interface IOrderDoc extends mongoose.Document {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: ITicketInfo[]; // เก็บตั๋วเป็น Array;
    version: number;
}

interface IOrderModel extends mongoose.Model<IOrderDoc> {
    build(attrs: IOrderAttrs): IOrderDoc;
}

// Schema สำหรับข้อมูลตั๋วแต่ละใบ (Sub-document)
const ticketInfoSchema = new mongoose.Schema({
    scheduleId: {
        type: String,
        required: true
    },
    busId: {
        type: String,
        required: true
    },
    origin: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    departureTime: {
        type: mongoose.Schema.Types.Date,
        required: true
    },
    passengerName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: false });


const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Created
    },
    expiresAt: {
        type: mongoose.Schema.Types.Date
    },
    ticket: [ticketInfoSchema],
    totalAmont: {
        type: Number,
        required: true
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

orderSchema.set('versionKey', 'version');
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: IOrderAttrs) => {
    return new Order(attrs);
}

const Order = mongoose.model<IOrderDoc, IOrderModel>('Order', orderSchema);
export { Order, ITicketInfo };