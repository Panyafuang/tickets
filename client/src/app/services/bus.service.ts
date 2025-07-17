import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IBusSchedule } from '../models/bus-schedule.model';

@Injectable({
  providedIn: 'root',
})
export class BusService {
  private apiUrl = '/api/bus';

  constructor(private http: HttpClient) {}

  /**
   * ค้นหาเที่ยวรถตามเงื่อนไขจากหน้าค้นหา
   * (จำเป็นต้องสร้าง Endpoint นี้ใน Backend: GET /api/bus/schedules/query)
   *
   * @param origin - ID หรือชื่อของต้นทาง
   * @param destination - ID หรือชื่อของปลายทาง
   * @param date - วันที่ที่ต้องการเดินทาง (รูปแบบ YYYY-MM-DD)
   * @returns Observable ของอาร์เรย์ BusSchedule ที่ตรงเงื่อนไข
   */
  findSchedules(origin: string, destination: string, date: string): Observable<IBusSchedule[]> {
    const params = new HttpParams()
      .set('origin', origin)
      .set('destination', destination)
      .set('date', date);

      return this.http.get<IBusSchedule[]>(`${this.apiUrl}/schedules`, { params });
  }

  // ใช้สำหรับดึงข้อมูลของเที่ยวรถ 1 เที่ยวเพื่อมาแสดงผังที่นั่ง (seatLayout)
  getScheduleById(scheduleId: string): Observable<IBusSchedule> {
    return this.http.get<IBusSchedule>(`${this.apiUrl}/schedules/${scheduleId}`);
  }
}
