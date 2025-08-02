import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router'; // เพิ่ม Router
import { OrderService } from '../../services/order.service';
import { IOrder } from '../../models/order.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { IUser } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css',
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  orderId!: string;
  order!: IOrder;
  msTimeLeft: number = 0;

  currUser!: IUser | null;
  currUserSup!: Subscription;

  private intervalId: any;
  showPaymentForm: boolean = false;

  ORDER_CREATED = 'created';

  constructor(
    private route: ActivatedRoute,
    private router: Router, // เพิ่ม Router
    private _orderService: OrderService,
    private _authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currUserSup = this._authService.currentUser$.subscribe((user) => (this.currUser = user));

    // เปลี่ยนจาก paramMap เป็น params เพื่อให้ยืดหยุ่นกับ path ที่อาจจะซ้อนกัน
    this.route.params.subscribe({
      next: (params: Params) => {
        // ดึง ID จาก path 'payment/:orderId' หรือ 'orders/:id'
        const idFromUrl = params['orderId'] || params['id'];
        if (!idFromUrl) {
          console.error('Order ID not found in URL');
          this.snackBar.open('ไม่พบรหัสออเดอร์', 'ปิด');
          this.router.navigate(['/']); // กลับไปหน้าแรกถ้าไม่มี ID
          return;
        }

        this.orderId = idFromUrl;
        this.loadOrderDetails();
      },
      error: (err) => {
        console.error('Error reading route params:', err);
        this.snackBar.open('เกิดข้อผิดพลาดในการโหลดหน้า', 'ปิด');
      }
    });
  }

  loadOrderDetails(): void {
    this._orderService.getOrderDetailById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        // console.log("Loaded Order:", this.order); // สำหรับ Debug

        // ล้าง interval เก่า (ถ้ามี) ก่อนเริ่มอันใหม่
        if (this.intervalId) {
          clearInterval(this.intervalId);
        }

        const expires = new Date(this.order.expiresAt);
        // ตรวจสอบสถานะและเวลาหมดอายุ ก่อนเริ่มนับถอยหลัง
        if (this.order.status === this.ORDER_CREATED && !isNaN(expires.getTime())) {
          this.findTimeLeft(expires); // เรียกครั้งแรกทันที
          this.intervalId = setInterval(
            () => this.findTimeLeft(expires),
            1000
          );
        } else {
          this.msTimeLeft = 0;
        }
      },
      error: (err) => {
        console.error('Failed to get order detail:', err);
        this.snackBar.open('ไม่สามารถโหลดรายละเอียดออเดอร์ได้', 'ปิด', {
          panelClass: ['error-snackbar'],
        });
      },
    });
  }


  private findTimeLeft(expires: Date): void {
    const diffInSeconds = (expires.getTime() - new Date().getTime()) / 1000;
    this.msTimeLeft = Math.round(diffInSeconds);

    if (diffInSeconds <= 0) {
      this.msTimeLeft = 0;
      if (this.order.status === this.ORDER_CREATED) {
        this.snackBar.open('หมดเวลาชำระเงินแล้ว', 'ปิด', {
            duration: 5000,
            panelClass: ['warning-snackbar'],
        });
        // อาจจะโหลดข้อมูล order ใหม่เพื่ออัปเดตสถานะเป็น expired จาก backend
        this.loadOrderDetails();
      }
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    }
  }

  onPayNow(): void {
    if (this.order && this.order.status === this.ORDER_CREATED && this.msTimeLeft > 0) {
      this.showPaymentForm = true;
    } else {
      this.snackBar.open('ไม่สามารถชำระเงินได้ ออเดอร์อาจหมดอายุหรือถูกยกเลิกไปแล้ว', 'ปิด', {
        panelClass: ['warning-snackbar'],
      });
    }
  }

  onPaymentCompleted(success: boolean): void {
    this.showPaymentForm = false;
    if (success) {
      this.snackBar.open('ชำระเงินเรียบร้อย', 'ปิด', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
      this.loadOrderDetails(); // โหลดข้อมูลใหม่เพื่ออัปเดตสถานะเป็น 'complete'
    } else {
      this.snackBar.open('การชำระเงินล้มเหลว', 'ปิด', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  onPaymentCancelled(): void {
    this.showPaymentForm = false;
    this.snackBar.open('ยกเลิกขั้นตอนการชำระเงิน', 'ปิด', {
      duration: 3000,
      panelClass: ['info-snackbar'],
    });
  }

  ngOnDestroy(): void {
    if (this.currUserSup) {
      this.currUserSup.unsubscribe();
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}