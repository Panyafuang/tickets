import mongoose from "mongoose";

// Interface สำหรับที่นั่งแต่ละที่
interface ISeatLayoutItem {
    seatNumber: string;
    isAvailable: boolean; // true = ว่าง, false = ไม่ว่าง
    bookedByUserId?: mongoose.Types.ObjectId; // User ID ที่จอง (ถ้ามี)
    status: 'available' | 'pending' | 'booked'; // สถานะของที่นั่ง: ว่าง, รอดำเนินการ, จองแล้ว

}

// Interface สำหรับ Document ที่จะได้จาก MongoDB
interface IBusScheduleDoc extends mongoose.Document {
    routeId: mongoose.Types.ObjectId;
    departureTime: Date;
    price: number;
    totalSeats: number;
    availableSeats: number;
    seatLayout: number;
}