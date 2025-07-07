import mongoose from "mongoose";


interface IRouteAttr {
    origin: string;      // จุดต้นทาง เช่น "กรุงเทพ (หมอชิต)"
    destination: string; // จุดปลายทาง เช่น "ศรีราชา"
}


interface IRouteDoc extends mongoose.Document {
    origin: string;
    destination: string;
}


// Interface สำหรับ Model (เพิ่มเมธอด build)
interface IRouteModel extends mongoose.Model<IRouteDoc> {
    build(attrs: IRouteAttr): IRouteDoc;
}

const routeSchema = new mongoose.Schema({
    origin: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true,
        trim: true
    },
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id; // เปลี่ยน _id เป็น id สำหรับ Frontend
            delete ret._id;
            delete ret.__v; // ลบ __v field
        }
    }
});

// สร้าง Static method สำหรับการสร้าง Document
routeSchema.statics.build = (attrs: IRouteAttr) => {
    return new Route(attrs);
}

// สร้าง Model
const Route = mongoose.model<IRouteDoc, IRouteModel>('Route', routeSchema);
export { Route }