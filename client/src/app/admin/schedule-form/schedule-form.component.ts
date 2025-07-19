import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ScheduleService } from '../services/schedule.service';
import { Observable } from 'rxjs';
import { IRoute } from '../../models/route.model';
import { RouteService } from '../../services/routs.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-schedule-form',
  templateUrl: './schedule-form.component.html',
  styleUrl: './schedule-form.component.css'
})
export class ScheduleFormComponent implements OnInit{
  scheduleForm!: FormGroup;
  isEditMode: boolean = false;
  routes$!: Observable<IRoute[]>; // สำหรับ Dropdown เลือก Route

  constructor(
    private _scheduleService: ScheduleService, 
    private _routeService: RouteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    
    this.scheduleForm = new FormGroup({
      routeId: new FormControl('', Validators.required),
      busId: new FormControl('', Validators.required),
      departureTime: new FormControl('', Validators.required),
      arrivalTime: new FormControl('', Validators.required),
      price: new FormControl(null, [Validators.required, Validators.min(1)]),
      totalSeats: new FormControl(null, [Validators.required, Validators.min(1)]),
    });

    // โหลดข้อมูล Route ทั้งหมดมาให้เลือก
    this.routes$ = this._routeService.getRoutes();
  }


  onSubmit(): void {
    if (this.scheduleForm.invalid) return;

    const formData = this.scheduleForm.getRawValue(); // ใช้ getRawValue() เพื่อเอาค่าจาก field ที่ disable ด้วย

    console.log(this.scheduleForm.value);
    console.log('formData -> ', formData);

    // Edit
    if (this.isEditMode) {

    } else {
    // new
    this._scheduleService.createScheule(formData).subscribe(() => {
      this.router.navigate(['/admin/schedules']);
    })
    }
  }
}
