import { OrderStatus } from "@xtptickets/common";
import mongoose from "mongoose"

interface IOrderAttrs {
    id: string;
    version: number;
    userId: string;
    price: number;
    status: OrderStatus;
}

interface IOrderDoc extends mongoose.Document {
    version: number;
    userId: string;
    price: number;
    status: OrderStatus;
}

/**
 * List of any custom methods we add to the overall collection
 */
interface IOrderModel extends mongoose.Model<IOrderDoc> {
    build(attrs: IOrderAttrs): IOrderDoc;
}