import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// Interface สำหรับ Attributes ที่ใช้ในการสร้าง Route
interface IRouteAttr {
  origin: string; // จุดต้นทาง เช่น "กรุงเทพ (หมอชิต)"
  destination: string; // จุดปลายทาง เช่น "ศรีราชา"
  distanceKm?: number;
  durationHours?: number;
}

// Interface สำหรับ Document ที่จะได้จาก MongoDB (รวมถึง _id, createdAt, updatedAt)
interface IRouteDoc extends mongoose.Document {
  origin: string;
  destination: string;
  distanceKm?: number;
  durationHours?: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface สำหรับ Model (เพิ่มเมธอด build)
interface IRouteModel extends mongoose.Model<IRouteDoc> {
  build(attrs: IRouteAttr): IRouteDoc;
}

const routeSchema = new mongoose.Schema(
  {
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    distanceKm: {
      type: Number,
      required: false,
      min: 0
    },
    durationHours: {
      type: Number,
      required: false,
      min: 0
    }
  },
  {
    timestamps: true, // เพิ่ม createdAt และ updatedAt โดยอัตโนมัติ
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id; // เปลี่ยน _id เป็น id สำหรับ Frontend
        delete ret._id;
        delete ret.__v; // ลบ __v field
      },
    },
  }
);

routeSchema.set('versionKey', 'version');
routeSchema.plugin(updateIfCurrentPlugin);

// สร้าง Static method สำหรับการสร้าง Document
routeSchema.statics.build = (attrs: IRouteAttr) => {
  return new Route(attrs);
};

// สร้าง Model
const Route = mongoose.model<IRouteDoc, IRouteModel>("Route", routeSchema);
export { Route };