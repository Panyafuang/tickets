import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ITicket } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';
import { OrderService } from '../../services/order.service';
import { IBackEndError } from '../../models/backend-error.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {
  ticketId!: string;
  ticket!: ITicket;
  backendErrors: IBackEndError[] = []; // เปลี่ยนชื่อจาก errorMsg เพื่อความชัดเจนว่ามาจาก backend

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _ticketService: TicketService,
    private _orderService: OrderService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.ticketId = params['id'];
      this._ticketService.getTicketById(this.ticketId).subscribe({
        next: (ticket) => {
          this.ticket = ticket;
        },
        error: (err) => { }
      })
    });
  }

  private getGeneralBackendErrors(): IBackEndError[] {
    return this.backendErrors.filter(err => !err.field);
  }

  onPurchase(ticketId: string) {
    this._orderService.orderByTicketId(ticketId).subscribe({
      next: (order) => {
        // this.snackBar.open('Your order has been placed successfully. Please complete the payment within 1 minute.', 'Close', {
        //   duration: 3000,
        //   panelClass: ['success-snackbar']
        // });

        // Redirect to orderDetail
        this.router.navigate([`/orders/${order.id}`]);

      }, error: (err) => {
        console.error('Order failed:', err);
        if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
          this.backendErrors = err.error.errors; // รับ error array จาก backend
        } else if (err.error && err.error.message) {
          // กรณี backend ส่ง error เป็น message เดี่ยวๆ ไม่ใช่ array
          this.backendErrors = [{ message: err.error.message }];
        } else {
          this.backendErrors = [{ message: 'An unexpected error occurred. Please try again.' }];
        }

        // แสดง error ผ่าน snackbar สำหรับ error ทั่วไป --> // กรณี backend ส่ง error เป็น message เดี่ยวๆ ไม่ใช่ array
        if (this.backendErrors.length > 0) {
          const generalErrors = this.getGeneralBackendErrors();
          if (generalErrors.length > 0) {
            this.snackBar.open(generalErrors[0].message, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
      }
    });
  }
}
