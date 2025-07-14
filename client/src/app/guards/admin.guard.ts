// import { CanActivateFn } from '@angular/router';

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, Observable, of } from 'rxjs';

// export const adminGuard: CanActivateFn = (route, state) => {
//   return true;
// };

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private _authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this._authService.currentUser$.pipe(
      map((user) => {
        if (user && user.role === 'admin') {
          return true;
        } else {
          this.router.navigate(['/']); // ถ้าไม่ใช่ ให้ redirect กลับหน้าแรก
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/']); // กรณีเกิด error ก็ให้ redirect
        return of(false);
      })
    );
  }
}
