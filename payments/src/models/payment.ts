import mongoose from "mongoose";

interface IPaymentAttr {
    orderId: string;
    stripeId: string;
}

interface IPaymentDoc extends mongoose.Document {
    orderId: string;
    stripeId: string;
}

interface IPaymentModel extends mongoose.Model<IPaymentDoc> {
    build(attrs: IPaymentAttr): IPaymentDoc;
}

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    stripeId: {
        type: String,
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

paymentSchema.statics.build = (attrs: IPaymentAttr) => {
    return new Payment(attrs);
}

const Payment = mongoose.model<IPaymentDoc, IPaymentModel>('Payment', paymentSchema);

export { Payment };