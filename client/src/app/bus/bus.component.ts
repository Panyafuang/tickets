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
    // 1. ตรวจสอบ Route ทันทีเมื่อ Component โหลดเสร็จ เพื่อตั้งค่า Stepper เริ่มต้นให้ถูกต้อง
    this.updateStepFromRoute();

    // 2. ดักฟังการเปลี่ยน Route ในอนาคต (เมื่อผู้ใช้คลิกเปลี่ยนหน้า)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateStepFromRoute();
    });
  }

  /**
   * ฟังก์ชันสำหรับอ่านค่า step จากข้อมูลของ Route ที่กำลัง active
   */
  private updateStepFromRoute(): void {
    let child = this.activatedRoute.firstChild;
    while(child) {
      if (child.firstChild) {
        child = child.firstChild;
      } else if (child.snapshot.data && child.snapshot.data['step']) {
        this.currentStep = child.snapshot.data['step'];
        return;
      } else {
        // ถ้าไม่เจอ step data ใน route ให้ใช้ค่า default
        this.currentStep = 1; 
        return;
      }
    }
    // ถ้าไม่มี child route เลย
    this.currentStep = 1;
  }
}