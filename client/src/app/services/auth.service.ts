import { Host, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Subject } from 'rxjs';
import { IUser } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user!: IUser | null;
  public userUpdated = new Subject<IUser | null>();

  constructor(private http: HttpClient) {}

  // getUserDetail() {
  //   const url = `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser`;

  //   return this.http
  //     .get<any>(url)
  //     .pipe(
  //       map((response) => {
  //         return response.currentUser;
  //       })
  //     )
  //     .subscribe((userData: IUser) => {
  //       this.user = userData;
  //       this.userUpdated.next(this.user);
  //     });
  // }

  // getUserDetail() {
  //   const url = `http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser`;
  //   // const headers = new HttpHeaders({
  //   //   'Host': 'localhost',
  //   //   'credentials': 'include'
  //   // });

  //   return this.http
  //     .get<any>(url)
  //     .pipe(
  //       map((response) => {
  //         return response.currentUser;
  //       })
  //     )
  //     .subscribe((userData: IUser) => {
  //       this.user = userData;
  //       this.userUpdated.next(this.user);
  //     });
  // }

  getUserDetail() {
    const url = `/api/users/currentuser`;
    return this.http
      .get<any>(url)
      .pipe(
        map((response) => {
          return response.currentUser;
        })
      )
      .subscribe((userData: IUser) => {
        this.user = userData;
        this.userUpdated.next(this.user);
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
      this.user = null;
      this.userUpdated.next(null);
    })
  }
}
