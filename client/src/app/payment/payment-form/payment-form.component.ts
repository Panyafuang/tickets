import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StripeCardElement, StripeElements, Stripe, PaymentIntent, StripeError } from '@stripe/stripe-js';
import { StripeService } from '../../services/stripe.service';
import { IUser } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
})
export class PaymentFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  paymentForm!: FormGroup;
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;

  cardErrors: string | null = null;
  loading = false;
  showQrCode: boolean = false;
  qrCodeUrl: string | null = null;
  paymentIntentStatus: string | null = null;

  currUser: IUser | null = null;
  currUserSub!: Subscription;

  // Input properties ที่จะรับมาจาก Parent Component (OrderDetailComponent)
  @Input() orderId!: string;
  @Input() orderPrice!: number;


  // Output event เพื่อแจ้ง Parent Component (OrderDetailComponent) เมื่อชำระเงินสำเร็จ/ล้มเหลว
  @Output() paymentCompleted = new EventEmitter<boolean>();
  @Output() paymentCancelled = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private _stripeService: StripeService,
    private _authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currUserSub = this._authService.userUpdated.subscribe((user) => {
      this.currUser = user;
    });
    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      email: [this.currUser?.email, [Validators.required, Validators.email]],
      paymentMethod: ['card', Validators.required] // <<< เพิ่มช่องเลือก Payment Method
    });

    // listen การเปลี่ยนแปลงของ paymentMethod
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      console.log('Payment method changed to:', method);
      this.showQrCode = false; // ซ่อน QR Code ถ้าเปลี่ยน method
      this.qrCodeUrl = null;
      this.paymentIntentStatus = null;
    });
  }

  ngOnDestroy(): void {
    this.currUserSub.unsubscribe();
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  // Stripe Element จำเป็นต้อง "mount" (ติดตั้ง) เข้ากับ DOM element
  async ngAfterViewInit(): Promise<void> {
    try {
      // 1. โหลด Stripe instance
      this.stripe = await this._stripeService.getStripe();

      if (!this.stripe) {
        console.error('Stripe instance could not be loaded.');

        this.snackBar.open(
          'Failed to load Stripe. Please try again.',
          'Close',
          { panelClass: ['error-snackbar'] }
        );
        this.paymentCompleted.emit(false);
      } else {
        // 2. สร้าง Stripe Elements
        this.elements = this.stripe?.elements();

        if (!this.elements) {
          console.error('Stripe Elements could not be created.');
          this.snackBar.open('Failed to initialize Stripe Elements.', 'Close', {
            panelClass: ['error-snackbar'],
          });
          this.paymentCompleted.emit(false);
        }

        // 3. สร้าง Card Element
        this.cardElement = this.elements.create('card', {
          style: {
            base: {
              iconColor: '#666EE8',
              color: '#313259',
              fontWeight: '300',
              fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
              fontSize: '18px',
              '::placeholder': {
                color: '#CFD7E0',
              },
            },
            invalid: {
              color: '#fa755a',
              iconColor: '#fa755a',
            },
          },
        });

        // 4. ตรวจสอบและ Mount Card Element เข้ากับ DOM
        if (this.cardElementRef && this.cardElementRef.nativeElement) {
          this.cardElement.mount(this.cardElementRef.nativeElement);
          console.log('Stripe Card Element mounted successfully.');
        } else {
          console.error('cardElementRef.nativeElement is not available.');

          this.snackBar.open(
            'Error: Card element container not found.',
            'Close',
            { panelClass: ['error-snackbar'] }
          );
          this.paymentCompleted.emit(false); // แจ้งว่าล้มเหลว
          return;
        }

        // 5. ดักจับ Event การเปลี่ยนแปลงของ Card Element
        this.cardElement.on('change', (event) => {
          this.cardErrors = event.error ? event.error.message : null;
        });
      }
    } catch (error) {
      console.error('Error initializing Stripe:', error);

      this.snackBar.open(
        'Error initializing payment. Check console.',
        'Close',
        {
          panelClass: ['error-snackbar'],
        }
      );
      this.paymentCompleted.emit(false);
    }
  }

  // Communicate with back-end API
  // async onSubmit(): Promise<void> {
  //   // 1. ตั้งค่าสถานะเริ่มต้น
  //   this.cardErrors = null; // เคลียร์ข้อความ error เก่าๆ ที่เกี่ยวกับบัตร
  //   this.loading = true; // แสดง spinner หรือ UI ที่บ่งบอกว่ากำลังโหลด


  //   // 2. ตรวจสอบความถูกต้องของฟอร์ม
  //   this.paymentForm.markAllAsTouched(); // ทำให้ทุกช่องในฟอร์มถูก "touched" เพื่อให้แสดง validation
  //   if (
  //     this.paymentForm.invalid ||
  //     !this.stripe ||
  //     !this.elements ||
  //     !this.cardElement
  //   ) {
  //     this.snackBar.open(
  //       'Please fill in all required fields and card details.',
  //       'Close',
  //       { duration: 3000, panelClass: ['error-snackbar'] }
  //     );
  //     this.loading = false; // ปิด loading
  //     return; // หยุดการทำงานถ้าฟอร์มไม่ถูกต้อง หรือ Stripe components ยังไม่พร้อม
  //   }


  //   // 3. ดึงข้อมูลจากฟอร์ม
  //   const { name, email } = this.paymentForm.value; // ดึงค่า name และ email ที่ผู้ใช้กรอก

  //   try {
  //     // 4. สร้าง Stripe Token
  //     // เรียกใช้ StripeService เพื่อสร้าง Token จาก cardElement และชื่อผู้ถือบัตร
  //     const { token, error } = await this._stripeService.createStripeToken(
  //       this.cardElement,
  //       name
  //     ).toPromise(); // ใช้ .toPromise() เพราะ createStripeToken คืนค่า Observable


  //     // 5. ตรวจสอบผลการสร้าง Token
  //     if (error) {
  //       console.error('Error creating token:', error);

  //       this.cardErrors = error.message || 'Failed to create payment token.';
  //       this.snackBar.open(this.cardErrors!, 'Close', { panelClass: ['error-snackbar'] });
  //       this.loading = false;
  //       return; // หยุดถ้าสร้าง Token ไม่สำเร็จ
  //     }
  //     if (!token) { // กรณีที่ไม่มี error แต่ก็ไม่มี token กลับมา (ไม่น่าจะเกิดขึ้น แต่กันไว้)
  //       throw new Error('Stripe token not received.');
  //     }


  //     // 6. ส่ง Token และข้อมูลอื่นๆ ไปยัง Backend เพื่อสร้าง Charge
  //     // เรียกใช้ StripeService.createCharge เพื่อส่ง Token ID, Order ID และ Email ไปยัง Backend
  //     const backendResponse = await this._stripeService.createCharge(
  //       token.id, // ID ของ Token ที่ได้จาก Stripe
  //       this.orderId // ID ของ Order ที่รับมาจาก Input
  //     ).toPromise(); // ใช้ .toPromise() เพราะ createCharge คืนค่า Observable



  //     // 7. จัดการผลลัพธ์จาก Backend
  //     this.loading = false; // ปิด loading
  //     if (backendResponse && backendResponse.id) { // ถ้า Backend ส่ง ID ของ Payment กลับมา
  //       this.snackBar.open('Payment successful! Your order has been confirmed.', 'Close', { panelClass: ['success-snackbar'] });
  //       this.paymentCompleted.emit(true); // <<< แจ้ง Parent Component ว่าชำระเงินสำเร็จ (true)

  //       this.router.navigate([`orders`, `list`]);
  //     } else {
  //       throw new Error('Backend did not return a successful payment ID.'); // Backend ส่งค่าไม่ถูกต้อง
  //     }

  //   } catch (backendError: any) { // 8. จัดการข้อผิดพลาดที่เกิดขึ้นในกระบวนการ (รวมถึงจาก Backend)
  //     this.loading = false; // ปิด loading
  //     console.error('Payment processing failed:', backendError);

  //     // พยายามดึงข้อความ Error ที่ชัดเจนที่สุด
  //     let errorMessage = 'An unexpected error occurred. Please try again.';

  //     if (backendError.error && backendError.error.errors && Array.isArray(backendError.error.errors)) {
  //       errorMessage = backendError.error.errors[0].message;
  //     } else if (backendError.error && backendError.error.message) {
  //       errorMessage = backendError.error.message;
  //     } else if (backendError.message) {
  //       errorMessage = backendError.message;
  //     }

  //     this.snackBar.open(errorMessage, 'Close', {
  //       panelClass: ['error-snackbar']
  //     });
  //     this.paymentCompleted.emit(false); // <<< แจ้ง Parent Component ว่าชำระเงินล้มเหลว (false)
  //   }
  // }

  async onSubmit(): Promise<void> {
    console.log('onSubmit() called.');
    this.loading = true;
    this.cardErrors = null;
    this.showQrCode = false; // ซ่อน QR code เก่า
    this.qrCodeUrl = null;
    this.paymentIntentStatus = null;

    this.paymentForm.markAllAsTouched();

    const selectedPaymentMethod = this.paymentForm.get('paymentMethod')?.value;
    console.log('Current selected payment method:', selectedPaymentMethod); // <<< ADD THIS
    const { name, email } = this.paymentForm.value;

    // ตรวจสอบความถูกต้องของฟอร์มพื้นฐาน
    if (this.paymentForm.invalid || !this.stripe || !this.elements) {
      console.warn('Form is invalid or Stripe not loaded. Form status:', this.paymentForm.status, 'Stripe:', !!this.stripe, 'Elements:', !!this.elements); // <<< ADD THIS
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      this.loading = false;
      return;
    }

    // ตรวจสอบ Card Element เฉพาะเมื่อเลือก 'card'
    if (selectedPaymentMethod === 'card' && !this.cardElement) {
      console.warn('Card method selected but cardElement is missing.'); // <<< ADD THIS
      this.snackBar.open('Card details not available. Please try again.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      this.loading = false;
      return;
    }

    try {
      console.log('Attempting to create Payment Intent for order:', this.orderId); // <<< ADD THIS BEFORE API CALL
      // 1. สร้าง Payment Intent บน Backend ก่อน
      const piResponse = await this._stripeService.createPaymentIntent(this.orderId).toPromise();
      const clientSecret = piResponse?.clientSecret;

      if (!clientSecret) {
        console.error('Client secret is null or undefined.'); // <<< ADD THIS
        throw new Error('Client secret not received from backend.');
      }

      let paymentResult: { paymentIntent?: PaymentIntent; error?: StripeError };

      if (selectedPaymentMethod === 'card') {
        // 2a. สำหรับบัตรเครดิต: ยืนยัน Card Payment Intent
        console.log('Confirming Card Payment...'); // <<< ADD THIS
        paymentResult = await this._stripeService.confirmCardPayment(clientSecret, this.cardElement!, name, email).toPromise();
      } else if (selectedPaymentMethod === 'promptpay') {
        // 2b. สำหรับพร้อมเพย์: ยืนยัน PromptPay Payment Intent
        console.log('Confirming PromptPay Payment...'); // <<< ADD THIS
        paymentResult = await this._stripeService.confirmPromptPayPayment(clientSecret, name, email).toPromise();
      } else {
        console.error('Unsupported payment method:', selectedPaymentMethod); // <<< ADD THIS
        throw new Error('Unsupported payment method selected.');
      }

      console.log('Payment confirmation result:', paymentResult); // <<< IMPORTANT: Check this!

      if (paymentResult.error) {
        console.error('Payment confirmation error:', paymentResult.error);
        this.cardErrors = paymentResult.error.message || 'Payment failed.';
        this.snackBar.open(this.cardErrors, 'Close', { panelClass: ['error-snackbar'] });
        this.loading = false;
        this.paymentCompleted.emit(false);
        return;
      }

      const paymentIntent = paymentResult.paymentIntent;

      if (!paymentIntent) {
        console.error('Payment Intent object is null or undefined.'); // <<< ADD THIS
        throw new Error('Payment Intent not received.');
      }

      console.log('Final Payment Intent status:', paymentIntent.status); // <<< Check this
      console.log('Final Payment Intent next_action:', paymentIntent.next_action); // <<< Check this

      // 3. จัดการผลลัพธ์ของ Payment Intent
      if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!'); // <<< ADD THIS
        // การชำระเงินสำเร็จทันที (เช่น บัตรเครดิตที่ไม่มี 3DS)
        this.snackBar.open('Payment successful! Your order has been confirmed.', 'Close', { panelClass: ['success-snackbar'] });
        this.loading = false;
        this.paymentCompleted.emit(true);
      } else if (paymentIntent.status === 'requires_action' && paymentIntent.next_action?.type === 'promptpay_display_qr_code') {
        console.log('Payment requires action: PromptPay QR Code display.'); // <<< ADD THIS
        // สำหรับ PromptPay: แสดง QR Code
        this.showQrCode = true;
        this.qrCodeUrl = (paymentIntent.next_action as any).promptpay_display_qr_code.data.image_url;
        this.paymentIntentStatus = 'pending'; // ตั้งสถานะ pending
        this.snackBar.open('Please scan the QR code to complete the payment.', 'Close', { duration: 0, panelClass: ['info-snackbar'] });
        this.loading = false;

        // *** ไม่ได้บันทึก Payment ใน Backend ตรงนี้ ***
        // Backend ของคุณควรจะรับ Webhook Event จาก Stripe เมื่อ Payment Intent เปลี่ยนสถานะเป็น 'succeeded'
        // แล้วค่อยสร้าง Payment Record และ publish event เช่น PaymentCreatedEvent
        // ในตัวอย่างนี้ เราจะถือว่า Frontend แค่แจ้งสถานะ ไม่ได้ยืนยันการบันทึก Payment ใน DB
        // คุณอาจจะต้องมี poll สถานะ หรือใช้ WebSocket/SSE ในแอปจริง
      } else if (paymentIntent.status === 'requires_confirmation' || paymentIntent.status === 'requires_payment_method') {
        // กรณีที่ต้องการยืนยันเพิ่มเติม (ไม่น่าจะเกิดขึ้นบ่อยกับ PromptPay/Card ปกติ)
        this.snackBar.open('Payment requires further action or invalid payment method. Please try again.', 'Close', { panelClass: ['warning-snackbar'] });
        this.loading = false;
        this.paymentCompleted.emit(false);
      } else {
        console.warn(`Unhandled Payment Intent status: ${paymentIntent.status}. Next action type: ${paymentIntent.next_action?.type}`); // <<< ADD THIS
        // สถานะอื่นๆ (เช่น processing, canceled)
        this.snackBar.open(`Payment status: ${paymentIntent.status}. Please check your payment.`, 'Close', { panelClass: ['warning-snackbar'] });
        this.loading = false;
        this.paymentCompleted.emit(false);
      }

    } catch (backendError: any) {
      this.loading = false;
      console.error('Payment processing failed in onSubmit catch block:', backendError); // <<< Check for errors here
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (backendError.error && backendError.error.errors && backendError.error.errors.length > 0) {
        errorMessage = backendError.error.errors[0].message;
      } else if (backendError.error && backendError.error.message) {
        errorMessage = backendError.error.message;
      } else if (backendError.message) {
        errorMessage = backendError.message;
      }

      this.snackBar.open(errorMessage, 'Close', { panelClass: ['error-snackbar'] });
      this.paymentCompleted.emit(false);
    }
  }


  onCancel(): void {
    this.paymentCancelled.emit(); // แจ้ง Parent ว่ายกเลิก
  }

  // เมธอดสำหรับตรวจสอบสถานะ PaymentIntent ด้วยตัวเอง (ไม่จำเป็นต้องใช้บ่อย แต่มีไว้ให้ดู)
  // ใน production ควรใช้ Webhook จาก Stripe เป็นหลัก
  async checkPaymentStatus(): Promise<void> {
    if (!this.stripe || !this.qrCodeUrl || !this.paymentIntentStatus) {
      this.snackBar.open('No active payment to check.', 'Close', { duration: 2000 });
      return;
    }

    this.loading = true; // แสดง loading indicator ระหว่าง check

    try {
      const paymentIntentId = this.qrCodeUrl.split('/').find((part, index, array) => array[index - 1] === 'pi_'); // อาจจะต้องดึง ID จาก URL หรือจาก response ก่อนหน้า
      if (!paymentIntentId) {
        throw new Error('Could not extract Payment Intent ID.');
      }

      const paymentIntent = await this.stripe.retrievePaymentIntent(paymentIntentId);

      if (paymentIntent.paymentIntent?.status === 'succeeded') {
        this.snackBar.open('Payment has been successfully completed!', 'Close', { panelClass: ['success-snackbar'] });
        this.paymentCompleted.emit(true);
        this.showQrCode = false;
        this.qrCodeUrl = null;
        this.paymentIntentStatus = null;
      } else if (paymentIntent.paymentIntent?.status === 'canceled') {
        this.snackBar.open('Payment was canceled.', 'Close', { panelClass: ['warning-snackbar'] });
        this.paymentCompleted.emit(false);
        this.showQrCode = false;
        this.qrCodeUrl = null;
        this.paymentIntentStatus = null;
      } else {
        this.snackBar.open(`Payment status: ${paymentIntent.paymentIntent?.status}. Waiting for payment...`, 'Close', { duration: 3000, panelClass: ['info-snackbar'] });
        this.paymentIntentStatus = paymentIntent.paymentIntent?.status || 'unknown';
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      this.snackBar.open('Failed to check payment status.', 'Close', { panelClass: ['error-snackbar'] });
    } finally {
      this.loading = false;
    }
  }
}
