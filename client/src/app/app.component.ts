import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'client';

  constructor(private _authService: AuthService) { }

  ngOnInit() {
    // เรียกใช้เมธอดนี้เมื่อแอปเริ่มต้น เพื่อดึงข้อมูลผู้ใช้
    this._authService.getUserDetail();
  }
}
