import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

/** ----------------------------------------- กำหนด TypeScript interfaces สำหรับ type safety ------------------------ */
/**
 *  - ใช้สำหรับ define โครงสร้างของข้อมูลเมื่อสร้าง Ticket ใหม่ (constructor parameter)
    - ใช้ใน static method build
 */
interface TicketAttrs {
  title: string;
  price: number;
  userId: string;
}

/**
 * - เป็น TypeScript interface สำหรับ document (ข้อมูลแต่ละ record ใน MongoDB)
   - สืบทอดจาก mongoose.Document เพื่อให้ได้ field เช่น _id, createdAt, ฯลฯ จาก Mongoose
 */
interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  userId: string;
  version: number;
}

/**
 * - สำหรับ define custom static methods บน model (ในกรณีนี้คือ .build)
   - ใช้คู่กับ mongoose.model<TicketDoc, TicketModel>()
 */
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    /**
     * toJSON ใช้เพื่อ ปรับรูปแบบของ JSON ที่ส่งออก:
        - เพิ่ม field id จาก _id
        - ลบ _id ออก เพื่อให้ JSON ที่ frontend รับไปดูสะอาดขึ้น
     */
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

ticketSchema.set('versionKey', 'version');
ticketSchema.plugin(updateIfCurrentPlugin);


/**
 * เพิ่ม static method build ลงใน schema
 * - เพิ่มฟังก์ชัน build ที่ช่วยสร้าง Ticket แบบมีการตรวจสอบ type ตาม TicketAttrs
   - ทำให้สามารถเขียนแบบนี้ได้: const ticket = Ticket.build({ title: 'Concert', price: '50', userId: 'abc123' });

 */
ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket(attrs);
};

/**
 * สร้าง model ที่มี:
    - เอกสารแต่ละตัวตรงกับ TicketDoc
    - model มี static method ตรงกับ TicketModel
 */
const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", ticketSchema);

export { Ticket };
