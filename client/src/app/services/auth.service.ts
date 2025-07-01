import { Host, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, map, Subject } from 'rxjs';
import { IUser } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // เปลี่ยนจาก Subject เป็น BehaviorSubject และให้ค่าเริ่มต้นเป็น null
  public userUpdated = new BehaviorSubject<IUser | null>(null);

  // ไม่ต้องมี private user!: IUser | null; แล้ว เพราะ BehaviorSubject จะเก็บค่าแทน
  // private user!: IUser | null;

  constructor(private http: HttpClient) { }

  getUserDetail() {
    // const url = `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser`;
    const url = `/api/users/currentuser`;
    return this.http
      .get<any>(url)
      .pipe(
        map((response) => {
          return response.currentUser;
        })
      )
      .subscribe((userData: IUser) => {
        // this.user = userData;
        // แทนที่จะกำหนด this.user ให้ใช้ next() เพื่อส่งค่าไปยัง BehaviorSubject
        this.userUpdated.next(userData);
      }, error => { // เพิ่ม error handling
        console.error('Failed to get user detail:', error);
        this.userUpdated.next(null); // ส่ง null ถ้าเกิด error
      });
  }

  getUserUpdatedLister() {
    return this.userUpdated.asObservable();
  }

  signup(email: string, password: string) {
    return this.http.post<any>(`/api/users/signup`, {
      email,
      password,
    });
  }


  signin(email: string, password: string) {
    return this.http.post<any>(`/api/users/signin`, {
      email, password
    });
  }

  signout() {
    this.http.post(`/api/users/signout`, {}).subscribe(data => {
      // this.user = null;
      // เมื่อ signout สำเร็จ ให้ส่ง null ไปยัง BehaviorSubject
      this.userUpdated.next(null);
    })
  }
}
