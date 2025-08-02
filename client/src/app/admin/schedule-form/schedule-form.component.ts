import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ScheduleService } from '../services/schedule.service';
import { Observable } from 'rxjs';
import { IRoute } from '../../models/route.model';
import { RouteService } from '../../services/routs.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-schedule-form',
  templateUrl: './schedule-form.component.html',
  styleUrl: './schedule-form.component.css',
})
export class ScheduleFormComponent implements OnInit {
  scheduleForm!: FormGroup;
  isEditMode: boolean = false;
  routes$!: Observable<IRoute[]>; // สำหรับ Dropdown เลือก Route
  private scheduleId: string | null = null;
  allRoutes: IRoute[] = [];

  constructor(
    private _scheduleService: ScheduleService,
    private _routeService: RouteService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.scheduleForm = new FormGroup({
      routeId: new FormControl('', Validators.required),
      busId: new FormControl('', Validators.required),
      departureDate: new FormControl(null, Validators.required),
      departureTime: new FormControl('', Validators.required),
      arrivalDate: new FormControl(null, Validators.required),
      arrivalTime: new FormControl('', Validators.required),
      price: new FormControl(null, [Validators.required, Validators.min(1)]),
      totalSeats: new FormControl(null, [
        Validators.required,
        Validators.min(1),
      ]),
    });

    // this.loadRoutes();
    this.checkIsEditMode();

    // โหลดข้อมูล Route ทั้งหมดมาให้เลือก
    this.routes$ = this._routeService.getRoutes();
  }

  private checkIsEditMode() {
    this.route.paramMap.subscribe((params) => {
      if (params.has('id')) {
        this.isEditMode = true;
        this.scheduleId = params.get('id');

        // ถ้าเป็นโหมดแก้ไข, ให้ดึงข้อมูลมาเติมฟอร์ม
        this._scheduleService
          .getScheduleById(this.scheduleId!)
          .subscribe((schedule) => {
            this.patchFormValues(schedule);
          });
      }
    });
  }

  private patchFormValues(schedule: any) {
    // แปลง ISO date string กลับเป็น Date object และ time string
    const departure = new Date(schedule.departureTime);
    const arrival = new Date(schedule.arrivalTime);

    this.scheduleForm.patchValue({
      routeId: schedule.routeId,
      busId: schedule.busId,
      departureDate: departure,
      departureTime: departure.toTimeString().substring(0, 5), // 'HH:mm'
      arrivalDate: arrival,
      arrivalTime: arrival.toTimeString().substring(0, 5), // 'HH:mm'
      price: schedule.price,
      totalSeats: schedule.totalSeats,
    });

    // Disable บาง field ที่ไม่ควรแก้ไขได้
    this.scheduleForm.get('routeId')?.disable();
    this.scheduleForm.get('totalSeats')?.disable();
  }

  loadRoutes() {
    this._routeService.getRoutes().subscribe((routes) => {
      this.allRoutes = routes;
    });
  }

  // Helper
  private combineDateAndTime(date: string | Date, time: string): string {
    const dateObj = new Date(date);
    const [hours, minutes] = time.split(':').map((str) => Number(str));
    /**
     * setHours(hours, minutes, seconds, milliseconds)
     */
    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj.toISOString();
  }

  // private combineDateAndTime(date: Date, time: string): string {
  //   const [hours, minutes] = time.split(':').map(Number);
  //   date.setHours(hours, minutes, 0, 0);
  //   // แปลงเป็นเวลาท้องถิ่นของไทย (GMT+7) แล้วค่อยแปลงเป็น ISO string
  //   // การลบ Timezone offset จะทำให้เวลาที่ได้เป็นเวลาท้องถิ่น ไม่ใช่ UTC
  //   const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  //   return localDate.toISOString().slice(0, -1); // ตัด 'Z' ออก
  // }

  onSubmit(): void {
    if (this.scheduleForm.invalid) return;

    const formData = this.scheduleForm.getRawValue(); // ใช้ getRawValue() เพื่อเอาค่าจาก field ที่ disable ด้วย

    // const formValue = this.scheduleForm.value;
    const departureTime = this.combineDateAndTime(
      formData.departureDate,
      formData.departureTime
    );
    const arrivalTime = this.combineDateAndTime(
      formData.arrivalDate,
      formData.arrivalTime
    );

    const scheduleData = {
      routeId: formData.routeId,
      busId: formData.busId,
      departureTime,
      arrivalTime,
      price: formData.price,
      totalSeats: formData.totalSeats,
    };

    console.log('scheduleData -> ', scheduleData);

    // Edit
    if (this.isEditMode) {
      this._scheduleService
        .updateSchedule(this.scheduleId!, scheduleData)
        .subscribe({
          next: () => {
            this.snackBar.open('Schedule updated successfully!', 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/admin/schedules']);
          },
          error: (err) => this.handleError(err),
        });
    } else {
      // new
      this._scheduleService.createScheule(scheduleData).subscribe({
        next: () => {
          this.snackBar.open('Schedule created successfully!', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/admin/schedules']);
        },
        error: (err) => this.handleError(err),
      });
    }
  }

  private handleError(err: any) {
    const message =
      err.error?.errors[0]?.message || 'An unexpected error occurred.';
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
}
