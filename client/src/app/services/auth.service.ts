import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map } from 'rxjs';
import { IUser } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `/api/users`;
  // private url = `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser`;

  // เปลี่ยนจาก Subject เป็น BehaviorSubject และให้ค่าเริ่มต้นเป็น null
  // 1. สร้าง "กล่องเก็บข้อมูล" ที่สามารถส่งข้อมูลล่าสุดให้ใครก็ได้ที่มาติดตาม
  private currentUserSource = new BehaviorSubject<IUser | null>(null);

  // 2. สร้าง "ท่อข้อมูล" แบบอ่านได้อย่างเดียว (Observable) จากกล่องเก็บข้อมูล
  //    เพื่อให้ Component อื่นๆ นำไปใช้ได้
  public currentUser$ = this.currentUserSource.asObservable();


  constructor(private http: HttpClient) { }


  // ควรเรียกเมธอดนี้แค่ครั้งเดียวตอนโหลดแอป หรือเมื่อจำเป็นต้องดึงข้อมูลผู้ใช้ล่าสุด
  getUserDetail() {
    return this.http
      .get<any>(`${this.apiUrl}/currentUser`)
      .pipe(
        map((response) => {
          return response.currentUser;
        })
      )
      .subscribe(
        (userData: IUser) => {
          // แทนที่จะกำหนด this.user ให้ใช้ next() เพื่อส่งค่าไปยัง BehaviorSubject
          this.currentUserSource.next(userData);
        },
        (error) => {
          // เพิ่ม error handling
          console.error('Failed to get user detail:', error);
          this.currentUserSource.next(null); // ส่ง null ถ้าเกิด error (เช่น unauthorized)
        }
      );
  }

  signup(email: string, password: string, firstname: string, lastname: string, sex: string, tel: string) {
    return this.http.post<IUser>(`${this.apiUrl}/signup`, {
      email,
      password,
      firstname,
      lastname,
      sex,
      tel,
    });
  }

  signin(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/signin`, {
      email,
      password,
    });
  }

  signout() {
    this.http.post(`${this.apiUrl}/signout`, {}).subscribe({
      next: () => {
        this.currentUserSource.next(null); // เมื่อ signout สำเร็จ ให้ส่ง null ไปยัง BehaviorSubject
      },
      error: (err) => {
        console.error('Signout failed:', err);
        // ถึงแม้ signout จะ fail ก็ควร clear user ออกจาก local state
        this.currentUserSource.next(null);
      },
    });
  }
}
