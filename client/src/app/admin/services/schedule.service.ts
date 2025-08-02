import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IBusSchedule } from '../../models/bus-schedule.model';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private apiUrl = '/api/bus/schedules';

  constructor(private http: HttpClient) {}

  /**
   * GET: /api/bus/schedules
   * ดึงข้อมูลเที่ยวรถทั้งหมด
   */
  getSchedules(): Observable<IBusSchedule[]> {
    return this.http.get<IBusSchedule[]>(`${this.apiUrl}/list`);
  }

  /**
   * POST: /api/bus/schedules
   * สร้างเที่ยวรถใหม่
   * @param scheduleData ข้อมูลสำหรับสร้างเที่ยวรถ
   */
  createScheule(scheduleData: Partial<IBusSchedule>): Observable<IBusSchedule> {
    return this.http.post<IBusSchedule>(this.apiUrl, scheduleData);
  }

  /**
   * PUT: /api/bus/schedules/:id
   * อัปเดตข้อมูลเที่ยวรถ (เช่น ราคา)
   * @param id ID ของเที่ยวรถที่จะอัปเดต
   * @param scheduleData ข้อมูลที่จะอัปเดต
   */
  updateSchedule(id: string, scheduleData: Partial<IBusSchedule>): Observable<IBusSchedule> {
    return this.http.put<IBusSchedule>(`${this.apiUrl}/${id}`, scheduleData);
  }

  /**
   * PUT: /api/bus/schedules/cancel/:id
   * ยกเลิกเที่ยวรถ
   * @param id ID ของเที่ยวรถที่จะยกเลิก
   */
  cancelSchedule(id: string): Observable<IBusSchedule> {
    return this.http.put<IBusSchedule>(`${this.apiUrl}/cancel/${id}`, {});
  }

  /**
   * GET: /api/bus/schedules/:id
   * (เพิ่มเข้ามา) สำหรับดึงข้อมูลเที่ยวรถเดียวเพื่อนำไปแก้ไขในฟอร์ม
   */
  getScheduleById(id: string): Observable<IBusSchedule> {
    return this.http.get<IBusSchedule>(`${this.apiUrl}/${id}`);
  }
}
