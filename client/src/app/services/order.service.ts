import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IOrder } from '../models/order.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private http: HttpClient) { }

  /**
   * ส่งคำขอไปยัง Backend เพื่อสร้าง Order ใหม่
   * นี่คือจุดเริ่มต้นของ Flow การจองแบบ Event-Driven ทั้งหมด
   * @param data ประกอบด้วย scheduleId และ Array ของ tickets (ข้อมูลที่นั่งและผู้โดยสาร)
   * @returns Observable ที่จะส่งข้อมูล Order ที่สมบูรณ์กลับมาเมื่อการจองได้รับการยืนยันแล้ว
   */
  orderByScheduleId(data: { scheduleId: string; tickets: any[]}): Observable<IOrder> {
    // การยิง POST request นี้จะไปกระตุ้น newOrderRouter ใน orders-service
    // ซึ่งจะเริ่มกระบวนการ "ถาม-ตอบ" ผ่าน NATS Events
    console.log('sendding data -> ', data);

    return this.http.post<IOrder>(`/api/orders`, data);
  }

  /**
   * ดึงข้อมูล Order ทั้งหมดของผู้ใช้ที่ล็อกอินอยู่
   * ใช้สำหรับหน้า "ตั๋วของฉัน" (My Tickets)
   * @returns Observable ที่จะส่ง Array ของ Order ทั้งหมดของผู้ใช้กลับมา
   */
  getOrders(): Observable<IOrder[]> {
    return this.http.get<IOrder[]>(`/api/orders`);
  }

  // /**
  //  * ดึงข้อมูลรายละเอียดของ Order เพียงใบเดียวตาม ID
  //  * มีประโยชน์สำหรับหน้าชำระเงิน (Payment Page) เพื่อแสดงสรุปรายการ
  //  * @param orderId ID ของ Order ที่ต้องการดึงข้อมูล
  //  * @returns Observable ที่จะส่งข้อมูล Order ฉบับเต็มกลับมา
  //  */
  getOrderDetailById(orderId: string): Observable<IOrder> {
    return this.http.get<IOrder>(`/api/orders/${orderId}`);
  }





  // ---------------------- โปรเจคเก่า ------------------------- //
  orderByTicketId_bk(ticketId: string) {
    return this.http.post<IOrder>(`/api/orders`, { ticketId });
  }

  getOrderDetailById_bk(orderId: string) {
    return this.http.get<IOrder>(`/api/orders/${orderId}`);
  }

  getOrders_bk() {
    return this.http.get<any>(`/api/orders`);
  }
}
