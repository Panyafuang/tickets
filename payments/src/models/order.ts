import { OrderStatus } from "@xtptickets/common";
import mongoose from "mongoose"
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface IOrderAttrs {
    id: string;
    version: number;
    userId: string;
    totalAmount: number;
    status: OrderStatus;
}

interface IOrderDoc extends mongoose.Document {
    version: number;
    userId: string;
    totalAmount: number;
    status: OrderStatus;
}

/**
 * List of any custom methods we add to the overall collection
 */
interface IOrderModel extends mongoose.Model<IOrderDoc> {
    build(attrs: IOrderAttrs): IOrderDoc;
}

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            required: true
        },
    },
    {
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id,
                delete ret._id
            }
        }
    }
);

orderSchema.set('versionKey', 'version');
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: IOrderAttrs) => {
    return new Order({
        _id: attrs.id,
        version: attrs.version,
        price: attrs.totalAmount,
        userId: attrs.userId,
        status: attrs.status
    });
}

const Order = mongoose.model<IOrderDoc, IOrderModel>('Order', orderSchema);
export { Order };