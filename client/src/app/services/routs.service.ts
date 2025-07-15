import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IRoute } from '../models/route.model';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private apiUrl = `/api/bus/routes`;

  constructor(private http: HttpClient) { }

  // ดึง Route ทั้งหมด
  getRoutes(): Observable<IRoute[]> {
    return this.http.get<IRoute[]>(this.apiUrl);
  }

  // ดึง Route เดียวด้วย ID
  getRouteById(id: string): Observable<IRoute> {
    return this.http.get<IRoute>(`${this.apiUrl}/${id}`);
  }

  // สร้าง Route ใหม่
  createRoute(routeData: Partial<IRoute>): Observable<IRoute> {
    return this.http.post<IRoute>(this.apiUrl, routeData);
  }

  // อัปเดต Route
  updateRoute(routeData: Partial<IRoute>, id: string): Observable<IRoute> {
    return this.http.put<IRoute>(`${this.apiUrl}/${id}`, routeData);
  }

  // ลบ Route
  deleteRoute(id: string): Observable<{}> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
