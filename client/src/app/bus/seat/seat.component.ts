import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BusService } from '../../services/bus.service';
import { IBusSchedule, ISeatLayoutItem } from '../../models/bus-schedule.model';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-seat',
  templateUrl: './seat.component.html',
  styleUrl: './seat.component.css'
})
export class SeatComponent implements OnInit {
  // --- Properties สำหรับเก็บข้อมูล ---
  schedule!: IBusSchedule; // เก็บข้อมูลเที่ยวรถที่จะแสดง
  bookingForm!: FormGroup; // FormGroup หลักสำหรับจัดการฟอร์มทั้งหมด
  selectedSeats: ISeatLayoutItem[] = []; // Array สำหรับเก็บที่นั่งที่ผู้ใช้เลือก

  isLoading: boolean = false; // เพิ่ม state สำหรับแสดง loading spinner

  // --- Getters สำหรับใช้ใน Template (HTML) ---
  // Getter สำหรับดึง FormArray ของผู้โดยสารออกมาจาก bookingForm ได้ง่ายขึ้น
  get passengers(): FormArray {
    return this.bookingForm.get('passengers') as FormArray;
  }

  // Getter สำหรับสร้างข้อความแสดงหมายเลขที่นั่งที่เลือก
  get selectedSeatNumbers(): string {
    return this.selectedSeats.length > 0 ? this.selectedSeats.map((s) => s.seatNumber).join(', ') : 'ยังไม่ได้เลือกที่นั่ง';
  }

  // Getter สำหรับคำนวณราคารวม
  get totalPrice(): number {
    if (!this.schedule) return 0;
    return this.selectedSeats.length * this.schedule.price;
  }

  constructor(
    private activateRoute: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private _busService: BusService,
    private _orderService: OrderService
  ) { }

  ngOnInit(): void {
    // 1. สร้างโครงของฟอร์มหลักทันทีที่ Component โหลด
    this.bookingForm = new FormGroup({
      contactDetails: new FormGroup({ // ฟอร์มย่อยสำหรับข้อมูลติดต่อ
        fullName: new FormControl('', Validators.required),
        phoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]),
        email: new FormControl('', [Validators.required, Validators.email]),
      }),
      passengers: new FormArray([]) // FormArray ที่จะใช้เก็บฟอร์มข้อมูลผู้โดยสารแต่ละคน
    });

    // 2. ดึงข้อมูลเที่ยวรถ (Schedule) จาก URL
    this.activateRoute.paramMap.pipe(
      // ใช้ switchMap เพื่อจัดการ Observable ให้ดีขึ้น
      // เมื่อได้ค่า paramMap (ข้อมูล URL) มาแล้ว จะเปลี่ยนไปเรียก busService แทน
      switchMap(params => {
        const scheduleId = params.get('scheduleId'); // ดึง 'scheduleId' จาก URL
        if (!scheduleId) {
          // ถ้าไม่มี ID ใน URL ให้แสดงข้อความแจ้งเตือนแล้วกลับไปหน้าค้นหา
          this.snackBar.open('ไม่พบข้อมูลเที่ยวรถ', 'ปิด', { duration: 3000 });
          this.router.navigate(['/bus/schedules']);
          throw new Error('Schedule ID not found'); // หยุดการทำงานของ Chain นี้
        }

        // ถ้ามี ID ให้เรียก Service เพื่อดึงข้อมูลเที่ยวรถ
        return this._busService.getScheduleById(scheduleId);
      })
    ).subscribe({ // ติดตามผลลัพธ์จากการเรียก Service
      next: (scheduleData) => {
        // เมื่อได้รับข้อมูลสำเร็จ, นำไปเก็บในตัวแปร schedule
        this.schedule = scheduleData;
      },
      error: (err) => {
        // หากเกิดข้อผิดพลาดในการดึงข้อมูล
        console.error('Could not load schedule:', err);
        this.snackBar.open('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'ปิด', { duration: 3000 });
        this.router.navigate(['/bus/schedules']);
      }
    });
  }

  // สร้าง FormGroup สำหรับผู้โดยสาร 1 คน
  createPassengerForm(seatNumber: String): FormGroup {
    return new FormGroup({
      seatNumber: new FormControl(seatNumber), // เก็บหมายเลขที่นั่งไว้กับฟอร์ม
      passengerName: new FormControl('', Validators.required),
      passengerType: new FormControl('ผู้ใหญ่', Validators.required)
    });
  }

  // ทำงานเมื่อผู้ใช้คลิกที่นั่ง
  toggleSeat(seat: ISeatLayoutItem): void {
    // ตรวจสอบว่าที่นั่งว่างหรือไม่
    if (seat.status !== 'available' && !this.isSelected(seat)) {
      this.snackBar.open(`ที่นั่งหมายเลข ${seat.seatNumber} ไม่ว่าง`, 'ปิด', {
        duration: 2000,
      });
      return;
    }
    const index = this.selectedSeats.findIndex(s => s.seatNumber === seat.seatNumber);

    if (index > -1) {
      // กรณี "ยกเลิก" การเลือกที่นั่ง
      this.selectedSeats.splice(index, 1); // เอาออกจาก Array ที่นั่งที่เลือก
      this.passengers.removeAt(index); // ลบฟอร์มผู้โดยสารที่ตำแหน่งเดียวกันออก
    } else {
      // กรณี "เลือก" ที่นั่งใหม่
      this.selectedSeats.push(seat); // เพิ่มใน Array ที่นั่งที่เลือก
      this.passengers.push(this.createPassengerForm(seat.seatNumber)); // เพิ่มฟอร์มผู้โดยสารใหม่
    }
  }

  // ตรวจสอบว่าที่นั่งนี้ถูกเลือกอยู่หรือไม่ (สำหรับใช้กับ [ngClass])
  isSelected(seat: ISeatLayoutItem): boolean {
    return this.selectedSeats.some(s => s.seatNumber === seat.seatNumber);
  }

  onGoBack(): void {
    this.router.navigate(['/bus/schedules']); // สั่งให้ Router กลับไปหน้าค้นหา
  }


  onSubmit(): void {
    // 1. ตรวจสอบความถูกต้องของฟอร์ม
    if (this.selectedSeats.length === 0) {
      this.snackBar.open('กรุณาเลือกที่นั่งอย่างน้อย 1 ที่', 'ปิด', { duration: 3000 });
      return;
    }
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched(); // แสดง error ของทุกช่องที่ยังไม่ถูกกรอก
      this.snackBar.open('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'ปิด', {
        duration: 3000,
      });
      return;
    }

    this.isLoading = true; // เริ่มแสดง loading

    // 2. เตรียมข้อมูลที่จะส่งไปสร้าง Order
    console.log('Booking Form Value:', this.bookingForm.value);
    const bookingData = {
      scheduleId: this.schedule.id,
      tickets: this.passengers.value.map((p: any) => ({
        seatNumber: p.seatNumber,
        passengerName: p.passengerName
      }))
    }

    // 3. เรียกใช้ Order Service เพื่อส่งข้อมูลไปยัง Backend
    this._orderService.orderByScheduleId(bookingData).subscribe({
      next: (newOrder) => {
        console.log('newOrder -> ', newOrder);

        this.isLoading = false;
        this.snackBar.open('สร้างรายการจองสำเร็จ!', 'ปิด', { duration: 3000 });

        // 4. เมื่อสำเร็จ, นำทางไปยังหน้าชำระเงินพร้อม Order ID
        // this.router.navigate(['/bus/payment', newOrder.id]);
        // Redirect to orderDetail
        this.router.navigate([`/orders/${newOrder.id}`]);
      },
      error: (err) => {
        console.log("🚀 ~ SeatComponent ~ onSubmit ~ err:", err)

        this.isLoading = false; // หยุด loading
        console.error('Failed to create order', err);

        // 5. หากล้มเหลว, แสดงข้อความ error ที่ได้จาก Backend
        const errorMessage = err?.error?.errors[0]?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
        this.snackBar.open(errorMessage, 'ปิด');
      }
    })


    // หลังจากนี้อาจจะส่งข้อมูลไปที่ Backend และ navigate ไปหน้าชำระเงิน
    this.router.navigate(['/bus/payment']);
  }

  // คำนวณตำแหน่งของที่นั่งบน Grid CSS (สำหรับใช้กับ [ngStyle])
  getSeatStyle(seatNumber: string): { [key: string]: any } {
    const row = parseInt(seatNumber, 10);
    let column;
    switch (seatNumber.slice(-1)) {
      case 'A': column = 1; break;
      case 'B': column = 2; break;
      case 'C': column = 4; break;
      case 'D': column = 5; break;
      default: column = 'auto';
    }
    return {
      'grid-row': row,
      'grid-column': column
    };
  }

}
