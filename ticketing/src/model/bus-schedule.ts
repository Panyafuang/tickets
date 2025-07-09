import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// Interface สำหรับข้อมูลที่จำเป็นในการสร้าง/อัปเดตสำเนา IBusSchedule
interface IBusScheduleAttrs {
  id: string; // ID นี้ต้องตรงกับ ID ของ BusSchedule ต้นฉบับ (Schedule 1: วันที่ 2025-07-08, 08:00 AM, ราคา 700 บาท, รถบัส "XYZ123")
  routeId: string;
  departureTime: Date;
  price: number;
  version: number;
}

// Interface สำหรับ IBusSchedule Document ที่ถูกคัดลอกมา
export interface IBusScheduleDoc extends mongoose.Document {
  routeId: string;
  departureTime: Date;
  price: number;
  version: number;
}

// Interface สำหรับ IBusSchedule Model
interface IBusScheduleModel extends mongoose.Model<IBusScheduleDoc> {
  build(attrs: IBusScheduleAttrs): IBusScheduleDoc;

  // เมธอดสำหรับหา document ที่จะอัปเดตจาก event (หาจาก ID และ version ก่อนหน้า)
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<IBusScheduleDoc | null>;
}


const busScheduleSchema = new mongoose.Schema({
    routeId: {
        type: String, // เก็บเป็น String ID ก็เพียงพอ
        required: true
    },
    departureTime: {
        type: mongoose.Schema.Types.Date,
        required: true,
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



// --- ตั้งค่า Version Control ---
busScheduleSchema.set('versionKey', 'version');
busScheduleSchema.plugin(updateIfCurrentPlugin);



// --- Static Methods ---
busScheduleSchema.statics.build = (attrs: IBusScheduleAttrs) => {
    return new BusSchedule({
        _id: attrs.id, // << สำคัญมาก: ใช้ ID จากต้นฉบับเป็น _id ของสำเนา
        routeId: attrs.routeId,
        departureTime: attrs.departureTime,
        price: attrs.price
    });
}

// ใช้สำหรับค้นหา Document ที่ถูกต้องเพื่ออัปเดตจาก event 'busSchedule:updated'
busScheduleSchema.statics.findByEvent = (event: { id: string, version: number}) => {
    return BusSchedule.findOne({
        _id: event.id,
        version: event.version - 1 // ต้องหา document ที่มี version ก่อนหน้า event นี้ 1 ขั้น
    });
}




const BusSchedule = mongoose.model<IBusScheduleDoc, IBusScheduleModel>('BusSchedule', busScheduleSchema);
export { BusSchedule }