import mongoose from "mongoose";

// Interface สำหรับ Attributes ที่ใช้ในการสร้าง Route
interface IRouteAttr {
  origin: string; // จุดต้นทาง เช่น "กรุงเทพ (หมอชิต)"
  destination: string; // จุดปลายทาง เช่น "ศรีราชา"
}

// Interface สำหรับ Document ที่จะได้จาก MongoDB (รวมถึง _id, createdAt, updatedAt)
interface IRouteDoc extends mongoose.Document {
  origin: string;
  destination: string;
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
  },
  {
    timestamps: true, // เพิ่ม createdAt และ updatedAt โดยอัตโนมัติ
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id; // เปลี่ยน _id เป็น id สำหรับ Frontend
        delete ret._id;
        delete ret.__v; // ลบ __v field
      },
    },
  }
);

// สร้าง Static method สำหรับการสร้าง Document
routeSchema.statics.build = (attrs: IRouteAttr) => {
  return new Route(attrs);
};

// สร้าง Model
const Route = mongoose.model<IRouteDoc, IRouteModel>("Route", routeSchema);
export { Route };