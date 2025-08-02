import { ITicket } from './ticket.model';


// อัปเดต Interface ให้ตรงกับข้อมูลจาก Backend
// ที่ตอนนี้เป็น tickets array และมี totalAmount

// Interface สำหรับแต่ละรายการตั๋วในออเดอร์
export interface ITicketItem {
  scheduleId: string;
  busId: string;
  origin: string;
  destination: string;
  departureTime: string;
  passengerName: string;
  seatNumber?: string; // เพิ่ม seatNumber (optional)
  price: number;
}

// export interface IOrder {
//     userId: string;
//     status: string;
//     expiresAt: string;
//     ticket: ITicket;
//     version: number;
//     id: string;
//     price?: number;
// }

// Interface หลักสำหรับออเดอร์
export interface IOrder {
  id: string;
  userId: string;
  status: 'created' | 'cancelled' | 'complete';
  expiresAt: string;
  tickets: ITicketItem[]; // เปลี่ยนจาก ticket object เป็น tickets array
  totalAmount: number; // เพิ่ม totalAmount
  version: number;
}