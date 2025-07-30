import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { switchMap } from 'rxjs';
import { IOrder } from '../../models/order.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrl: './payment-page.component.css'
})
export class PaymentPageComponent implements OnInit {
  order: IOrder | undefined;

  constructor(
    private activateRoute: ActivatedRoute,
    private router: Router,
    private _orderService: OrderService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.activateRoute.paramMap.pipe(
      // ใช้ switchMap เพื่อจัดการ Observable ให้ดีขึ้น
      switchMap(params => {
        const orderId = params.get('orderId'); // pull orderId from URL
        if (!orderId) {
          this.router.navigate(['/']);
          throw new Error('Order ID not found');
        }

        return this._orderService.getOrderDetailById(orderId);
      })
    ).subscribe(orderData => {
      this.order = orderData;
    });
  }

  /**
   * Callback function ที่จะถูกเรียกโดย PaymentFormComponent
   * เมื่อกระบวนการชำระเงินสิ้นสุดลง (ไม่ว่าจะสำเร็จหรือล้มเหลว)
   * @param success ผลลัพธ์ของการชำระเงิน
   */
  onPaymentSuccess(success: boolean): void {
    if (success) {
      // หากชำระเงินสำเร็จ, นำทางไปยังหน้า "ตั๋วของฉัน"
      this.router.navigate(['/my-tickets']);
    } else {
      this.snackBar.open('การชำระเงินล้มเหลว กรุณาลองใหม่อีกภายหลัง', 'ปิด', { duration: 3000 });
    }
  }

}
