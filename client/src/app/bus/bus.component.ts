import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-bus',
  templateUrl: './bus.component.html',
  styleUrls: ['./bus.component.css'],
})
export class BusComponent implements OnInit {
  currentStep: number = 1;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    // ติดตามการเปลี่ยนแปลงของ Router
    this.router.events.pipe(
      // กรองเอาเฉพาะ event ตอนที่เปลี่ยนหน้าเสร็จแล้ว
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // เข้าถึง child route ที่กำลังแสดงผลอยู่
      let child = this.activatedRoute.firstChild;

      // วนลูปเผื่อมี child route ซ้อนกันหลายชั้น
      while (child) {
        if (child.firstChild) {
          child = child.firstChild;
        } else if (child.snapshot.data && child.snapshot.data['step']) {
          // ถ้าเจอข้อมูล 'step' ใน route ให้เอาค่ามาใส่ในตัวแปร currentStep
          this.currentStep = child.snapshot.data['step'];
          return;
        } else {
          return;
        }
      }
    });
  }
}