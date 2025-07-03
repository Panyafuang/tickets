import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr'; // For notifications
import { PaymentIntent } from '@stripe/stripe-js'; // Import PaymentIntent type
import { StripeService } from '../../services/stripe.service';

@Component({
  selector: 'app-payment-status',
  templateUrl: './payment-status.component.html',
  styleUrls: ['./payment-status.component.css']
})
export class PaymentStatusComponent implements OnInit {
  clientSecret: string | null = null;
  paymentIntent: PaymentIntent | null = null;
  statusMessage: string = 'Checking payment status...';
  isLoading: boolean = true;
  isSuccess: boolean = false;
  isFailed: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private _stripeService: StripeService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    console.log('payment-status init...')

    this.activatedRoute.paramMap.subscribe(params => {
      this.clientSecret = params.get('clientSecret');
      console.log('this.clientSecret -> ', this.clientSecret)

      if (this.clientSecret) {
        this.retrievePaymentIntentStatus(this.clientSecret);
      } else {
        this.statusMessage = 'Error: Payment Client Secret not found.';
        this.isFailed = true;
        this.isLoading = false;
        this.toastr.error(this.statusMessage, 'Error');
      }
    });
  }

  private async retrievePaymentIntentStatus(clientSecret: string): Promise<void> {
    this.isLoading = true;
    this.isSuccess = false;
    this.isFailed = false;

    try {
      const stripeInstance = await this._stripeService.getStripe();
      if (!stripeInstance) {
        throw new Error('Stripe.js not loaded.');
      }

      const { paymentIntent, error } = await stripeInstance.retrievePaymentIntent(clientSecret);

      if (error) {
        this.statusMessage = `Error retrieving payment status: ${error.message}`;
        this.isFailed = true;
        this.toastr.error(this.statusMessage, 'Payment Error');
      } else if (paymentIntent) {
        this.paymentIntent = paymentIntent;
        console.log('Retrieved Payment Intent:', paymentIntent);

        switch (paymentIntent.status) {
          case 'succeeded':
            this.statusMessage = 'Payment Succeeded!';
            this.isSuccess = true;
            this.toastr.success(this.statusMessage, 'Success');
            // *** สำคัญ: เรียก Backend ของคุณเพื่อยืนยันและอัปเดตสถานะ Order ที่นี่ ***
            // เช่น this.orderService.updateOrderStatus(paymentIntent.id, 'succeeded');
            break;
          case 'processing':
            this.statusMessage = 'Payment is processing. Please wait...';
            this.toastr.info(this.statusMessage, 'Info');
            break;
          case 'requires_payment_method':
            this.statusMessage = 'Payment failed. Please try again.';
            this.isFailed = true;
            this.toastr.error(this.statusMessage, 'Failed');
            break;
          case 'requires_action':
            // ผู้ใช้อาจจะยังไม่สแกน QR หรือยังไม่ยืนยัน
            this.statusMessage = 'Payment requires further action. Please complete the payment.';
            this.toastr.warning(this.statusMessage, 'Action Required');
            // คุณอาจจะต้องให้ผู้ใช้กลับไปที่หน้าชำระเงินเดิม
            break;
          case 'canceled':
            this.statusMessage = 'Payment was canceled.';
            this.isFailed = true;
            this.toastr.info(this.statusMessage, 'Canceled');
            break;
          default:
            this.statusMessage = `Payment status: ${paymentIntent.status}`;
            this.toastr.info(this.statusMessage, 'Status');
            break;
        }
      } else {
        this.statusMessage = 'No payment intent data found.';
        this.isFailed = true;
        this.toastr.error(this.statusMessage, 'Error');
      }
    } catch (error: any) {
      this.statusMessage = `An unexpected error occurred: ${error.message || 'Unknown error'}`;
      this.isFailed = true;
      this.toastr.error(this.statusMessage, 'Error');
    } finally {
      this.isLoading = false;
    }
  }

  // เมธอดสำหรับกลับไปหน้า Home หรือ Order History
  goToHome(): void {
    this.router.navigateByUrl('/');
  }

  goToOrderHistory(): void {
    // Assume you have an order history route
    this.router.navigateByUrl('/order-history');
  }
}