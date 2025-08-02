/**
 * Interface สำหรับที่นั่งแต่ละที่ในฝั่ง Client
 * เพิ่ม 'selected' property สำหรับจัดการสถานะการเลือกใน UI
 */
export interface ISeatLayoutItem {
  seatNumber: string;
  isAvailable: boolean;
  status: 'available' | 'pending' | 'booked';
  bookedByUserId?: string;
  bookedByGender?: 'male' | 'female' | 'other';
  selected?: boolean; // Property สำหรับ UI เท่านั้น
}

/**
 * Interface หลักสำหรับข้อมูลตารางเดินรถที่รับมาจาก Backend
 */
export interface IBusSchedule {
  id: string; // Mongoose's _id is transformed to id
  routeId: string;
  busId: string; // ทะเบียนรถ
  departureTime: string; // เวลาเดินทาง
  arrivalTime: string; // เวลาถึงปลายทาง
  price: number;
  totalSeats: number;
  availableSeats: number;
  seatLayout: ISeatLayoutItem[];
  origin?: string;
  destination?: string;
}
