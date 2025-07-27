import mongoose from "mongoose";
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { IRouteDoc } from "./route";

/**
 * Interface สำหรับข้อมูลของที่นั่งแต่ละที่
 * - status: 'locked' ใช้สำหรับล็อกที่นั่งชั่วคราวระหว่างรอการชำระเงิน
 * - orderId: ระบุว่า Order ใดกำลังล็อกที่นั่งนี้อยู่
 */
interface ISeatLayoutItem {
  // seatNumber: string;
  // isAvailable: boolean; // true = ว่าง, false = ไม่ว่าง
  // bookedByUserId?: mongoose.Types.ObjectId; // User ID ที่จอง (ถ้ามี)
  // bookedByGender?: "male" | "female" | "other";
  // status: "available" | "pending" | "booked"; // สถานะของที่นั่ง: ว่าง, รอดำเนินการ, จองแล้ว
  // lockedByTicketId?: mongoose.Types.ObjectId; // ID ของ Ticket ที่กำลังล็อคที่นั่ง (สำหรับสถานะ pending)
  // lockedAt?: Date; // เวลาที่ล็อค

  seatNumber: string;
  status: 'available' | 'booked' | 'locked';
  orderId?: string;
  isAvailable: boolean;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง BusSchedule
 * - เพิ่ม origin และ destination เพื่อให้ Model นี้เป็น Source of Truth ที่สมบูรณ์
 */
interface IBusScheduleAttrs {
  routeId: string;
  busId: string;
  // origin: string;
  // destination: string;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
  totalSeats: number;
  availableSeats: number;
  seatLayout: ISeatLayoutItem[];
}


/**
 * Interface สำหรับ BusSchedule Document ที่ได้จาก MongoDB
 */
interface IBusScheduleDoc extends mongoose.Document {
  routeId: IRouteDoc; // อ้างอิงไปยัง Route Model
  busId: string; // ID ของรถบัส (อาจจะอ้างอิง Bus Model จริงๆ ในอนาคต) อาจจะเป็นหมายเลขทะเบียนรถ, รหัสภายในของบริษัท, หรืออะไรก็ได้ที่เราตกลงกันไว้
  departureTime: Date; // เวลาออกเดินทาง
  arrivalTime: Date; // เวลาถึงที่หมาย
  price: number; // ราคาต่อที่นั่งสำหรับตารางเดินรถนี้
  totalSeats: number; // จำนวนที่นั่งทั้งหมด
  availableSeats: number; // จำนวนที่นั่งที่ยังว่างอยู่
  seatLayout: ISeatLayoutItem[]; // ผังที่นั่งพร้อมสถานะ
  isCancelled: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  origin: string;
  destination: string;

  // Methods
  findSeat(seatNumber: string): ISeatLayoutItem[];
}

// Interface สำหรับ Model (เพิ่มเมธอด build และ initializeSeats)
interface IBusScheduleModel extends mongoose.Model<IBusScheduleDoc> {
  build(attrs: IBusScheduleAttrs): IBusScheduleDoc;
  initializeSeats(totalSeats: number): ISeatLayoutItem[];
}

// Schema สำหรับ Sub-document (ข้อมูลที่นั่ง)
const seatLayoutSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['available', 'booked', 'locked']
  },
  orderId: { type: String, required: false }
}, { _id: false });

const busScheduleSchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Route",
  },
  busId: {
    type: String,
    required: true,
    trim: true,
  },
  departureTime: {
    type: Date,
    required: true,
  },
  arrivalTime: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0,
  },
  seatLayout: [seatLayoutSchema],
  isCancelled: {
    type: Boolean,
    required: true,
    default: false
  }

}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

// ----------------------------------------- Version ตั้งค่า Optimistic Concurrency Control --------------------------------- //
busScheduleSchema.set('versionKey', 'version'); // บอก Mongoose ให้ใช้ field ชื่อ 'version'
busScheduleSchema.plugin(updateIfCurrentPlugin); // สั่งให้ Schema นี้ใช้ Plugin



// ----------------------------------------- Static Method --------------------------------- //
// Static method สำหรับการสร้าง Document
busScheduleSchema.statics.build = (attrs: IBusScheduleAttrs) => {
  return new BusSchedule(attrs);
}

// Static method สำหรับสร้างผังที่นั่งเริ่มต้น
// ปรับ Logic นี้ตามผังที่นั่งจริงของรถบัสของคุณ (เช่น 2x2, 2x1)
busScheduleSchema.statics.initializeSeats = (totalSeats: number): ISeatLayoutItem[] => {
  const seats: ISeatLayoutItem[] = [];
  const seatsPerRow = 4; // สมมติ 4 ที่นั่งต่อแถว (A, B, C, D)
  const numRows = Math.ceil(totalSeats / seatsPerRow); // คำนวณจำนวนแถวทั้งหมดที่ต้องสร้าง Math.ceil จะทำการปัดเศษขึ้นเสมอ เช่น ถ้ามี totalSeats = 41 ที่นั่ง 41 / 4 = 10.25 จะถูกปัดขึ้นเป็น 11 แถว


  for (let i = 1; i <= numRows; i++) {
    ['A', 'B', 'C', 'D'].forEach(char => {
      /**
       * - นี่คือเงื่อนไขที่สำคัญมาก เป็นการตรวจสอบว่าจำนวนที่นั่งที่สร้างขึ้นใน Array seats ยังน้อยกว่า totalSeats ที่ต้องการหรือไม่

      เพื่อป้องกันการสร้างที่นั่งเกิน เช่น ถ้ารถมี 41 ที่นั่ง เมื่อวนลูปไปถึงแถวที่ 11 จะสร้างที่นั่ง 11A แล้วเงื่อนไขนี้จะเป็น false ทันทีหลังจากนั้น เพราะ seats.length จะเท่ากับ 41 แล้ว ทำให้ไม่สร้าง 11B, 11C, 11D ออกมา
       */
      if (seats.length < totalSeats) {
        seats.push({
          seatNumber: `${i}${char}`,
          isAvailable: true,
          status: 'available'
        });
      }
    });
  }
  return seats;
}


// ----------------------------------------- Instance Method --------------------------------- //

busScheduleSchema.methods.findSeat = function (seatNumber: string): ISeatLayoutItem | undefined {
  return this.seatLayout.find((seat: ISeatLayoutItem) => seat.seatNumber === seatNumber);
}


const BusSchedule = mongoose.model<IBusScheduleDoc, IBusScheduleModel>('BusSchedule', busScheduleSchema);
export { BusSchedule }