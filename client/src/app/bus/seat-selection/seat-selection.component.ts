import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IBusSchedule, ISeatLayoutItem } from '../../models/bus-schedule.model';
import { RouteService } from '../../services/routs.service';
import { IRoute } from '../../models/route.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-seat-selection',
  templateUrl: './seat-selection.component.html',
  styleUrls: ['./seat-selection.component.css'],
})
export class SeatSelectionComponent implements OnInit {
  @Input() schedule!: IBusSchedule;
  @Output() bookingSubmit = new EventEmitter<any>();
  @Output() goBack = new EventEmitter<void>();

  bookingForm!: FormGroup;
  selectedSeats: ISeatLayoutItem[] = [];
  route: IRoute | null = null;

  // Getter สำหรับแสดงผลใน HTML
  get passengers(): FormArray {
    return this.bookingForm.get('passengers') as FormArray;
  }

  get selectedSeatNumbers(): string {
    return this.selectedSeats.length > 0
      ? this.selectedSeats.map((s) => s.seatNumber).join(', ')
      : 'ยังไม่ได้เลือก';
  }

  get totalPrice(): number {
    if (!this.schedule) return 0;
    return this.selectedSeats.length * this.schedule.price;
  }

  constructor(
    private fb: FormBuilder,
    private _routeService: RouteService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // โหลดข้อมูลเส้นทาง
    if (this.schedule?.routeId) {
      this._routeService.getRouteById(this.schedule.routeId).subscribe((route) => {
        this.route = route;
      });
    }

    // สร้างฟอร์มหลัก
    this.bookingForm = this.fb.group({
      contactDetails: this.fb.group({
        fullName: ['', Validators.required],
        phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
        email: ['', [Validators.required, Validators.email]],
      }),
      passengers: this.fb.array([]), // <-- FormArray สำหรับผู้โดยสารแต่ละคน
    });
  }

  /**
   * สร้างฟอร์มย่อยสำหรับผู้โดยสาร 1 คน
   */
  createPassengerForm(seatNumber: string): FormGroup {
    return this.fb.group({
      seatNumber: [seatNumber], // เก็บหมายเลขที่นั่งไว้กับข้อมูลผู้โดยสาร
      passengerName: ['', Validators.required],
      passengerType: ['ผู้ใหญ่', Validators.required],
    });
  }

  /**
   * สลับการเลือก/ยกเลิกการเลือกที่นั่ง
   */
  toggleSeat(seat: ISeatLayoutItem): void {
    if (seat.status !== 'available' && !this.isSelected(seat)) {
      this.snackBar.open(`ที่นั่งหมายเลข ${seat.seatNumber} ไม่ว่าง`, 'ปิด', {
        duration: 2000,
      });
      return;
    }

    const index = this.selectedSeats.findIndex(s => s.seatNumber === seat.seatNumber);

    if (index > -1) {
      // --- กรณีเอาที่นั่งออก ---
      this.selectedSeats.splice(index, 1);
      this.passengers.removeAt(index); // ลบฟอร์มผู้โดยสารออกจาก FormArray
    } else {
      // --- กรณีเลือกที่นั่ง ---
      this.selectedSeats.push(seat);
      this.passengers.push(this.createPassengerForm(seat.seatNumber)); // เพิ่มฟอร์มใหม่
    }
  }

  /**
   * ตรวจสอบว่าที่นั่งนี้ถูกเลือกอยู่หรือไม่
   */
  isSelected(seat: ISeatLayoutItem): boolean {
    return this.selectedSeats.some(s => s.seatNumber === seat.seatNumber);
  }

  /**
   * ยืนยันการจอง
   */
  onSubmit(): void {
    if (this.selectedSeats.length === 0) {
      this.snackBar.open('กรุณาเลือกที่นั่งอย่างน้อย 1 ที่', 'ปิด', { duration: 3000 });
      return;
    }
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.snackBar.open('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'ปิด', {
        duration: 3000,
      });
      return;
    }

    console.log('Booking Form Value:', this.bookingForm.value);
    // ส่งข้อมูลทั้งหมดกลับไปให้ Parent Component
    this.bookingSubmit.emit(this.bookingForm.value);
  }

  /**
   * คำนวณตำแหน่งของที่นั่งบน Grid CSS
   * @param seatNumber หมายเลขที่นั่ง เช่น '1A', '7D'
   * @returns object สำหรับ [ngStyle] เพื่อกำหนด grid-row และ grid-column
   */
  getSeatStyle(seatNumber: string): { [key: string]: any } {
    const row = parseInt(seatNumber, 10);
    let column;

    // กำหนดคอลัมน์ตามตัวอักษร A, B, C, D
    switch (seatNumber.slice(-1)) {
      case 'A': column = 1; break;
      case 'B': column = 2; break;
      case 'C': column = 4; break;
      case 'D': column = 5; break;
      default:  column = 'auto';
    }

    return {
      'grid-row': row,
      'grid-column': column
    };
  }
}