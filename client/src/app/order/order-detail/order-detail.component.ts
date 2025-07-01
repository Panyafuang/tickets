import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { IOrder } from '../../models/order.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentDialogComponent } from '../../dialog/payment-dialog/payment-dialog.component';
import { AuthService } from '../../services/auth.service';
import { IUser } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  orderId!: string;
  order!: IOrder;
  msTimeLeft: number = 0;
  
  currUser!: IUser | null;
  currUserSup!: Subscription;

  private intervalId: any;

  constructor(
    private route: ActivatedRoute,
    private _orderService: OrderService,
    private _authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.currUserSup = this._authService.userUpdated.subscribe(user => this.currUser = user);

    this.route.params.subscribe((params: Params) => {
      this.orderId = params['id'];

      this._orderService.getOrderDetailById(this.orderId).subscribe({
        next: (order) => {
          this.order = order;

          const expires = new Date(this.order.expiresAt);
          if (!isNaN(expires.getTime())) {
            this.intervalId = setInterval(() => this.findTimeLeft(expires), 1000);
          } else {
            this.msTimeLeft = 0;
          }

        }, error: (err) => {
          console.error("Failed to get order detail:", err);
          this.snackBar.open('Failed to load order details.', 'Close', { panelClass: ['error-snackbar'] });
        }
      });
    });
  }

  private findTimeLeft(expires: Date): void {
    const diff = (expires.getTime() - new Date().getTime()) / 1000;
    this.msTimeLeft = Math.round(diff);

    // หยุด interval ด้วยตัวเองด้วย ถ้าเวลาหมด
    if (diff <= 0 && this.intervalId) {
      this.msTimeLeft = 0; // ตั้งค่าเป็น 0 เพื่อแสดงว่าหมดอายุ
      this.snackBar.open('Order has expired!', 'Close', { duration: 5000, panelClass: ['warning-snackbar'] });
      clearInterval(this.intervalId);
    }
  }

  onRedirectToCheckOut(): void {
    if (this.order && this.order.status !== 'cancelled' && this.msTimeLeft > 0) {
      // เปิด MatDialog และส่งข้อมูล orderId กับ price ไปให้ PaymentDialogComponent
      const dialogRef = this.dialog.open(PaymentDialogComponent, {
        width: '500px', // กำหนดความกว้างของ Dialog
        disableClose: true, // ป้องกันการปิด Dialog โดยการคลิกภายนอกหรือกด Esc
        data: {
          orderId: this.order.id,
          price: this.order.ticket.price, // ส่ง price ไปด้วย
          email: this.currUser?.email
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        // result จะเป็น true ถ้าชำระเงินสำเร็จ, false ถ้าถูกยกเลิก/ล้มเหลว
        if (result === true) {
          this.snackBar.open('Payment process completed.', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          // อาจจะต้องการโหลด order ใหม่ หรือ redirect ไปยังหน้าสรุป
          this._orderService.getOrderDetailById(this.orderId).subscribe(updatedOrder => {
            this.order = updatedOrder; // อัปเดตสถานะ Order
            // ตรวจสอบว่า order.status เปลี่ยนเป็น 'complete' หรือไม่
          });
        } else {
          this.snackBar.open('Payment process cancelled or failed.', 'Close', { duration: 3000, panelClass: ['info-snackbar'] });
        }
      });
    } else {
      this.snackBar.open('Cannot proceed with payment. Order expired or cancelled.', 'Close', { panelClass: ['warning-snackbar'] });
    }
  }

  ngOnDestroy(): void {
    this.currUserSup.unsubscribe();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

}
