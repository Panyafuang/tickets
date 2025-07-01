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
import { StripeCardElement, StripeElements, Stripe } from '@stripe/stripe-js';
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
  ) {}

  ngOnInit(): void {
    this.currUserSub = this._authService.userUpdated.subscribe((user) => {
      this.currUser = user;
    });
    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      email: [this.currUser?.email, [Validators.required, Validators.email]],
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
  async onSubmit(): Promise<void> {
    // 1. ตั้งค่าสถานะเริ่มต้น
    this.cardErrors = null; // เคลียร์ข้อความ error เก่าๆ ที่เกี่ยวกับบัตร
    this.loading = true; // แสดง spinner หรือ UI ที่บ่งบอกว่ากำลังโหลด


    // 2. ตรวจสอบความถูกต้องของฟอร์ม
    this.paymentForm.markAllAsTouched(); // ทำให้ทุกช่องในฟอร์มถูก "touched" เพื่อให้แสดง validation
    if (
      this.paymentForm.invalid ||
      !this.stripe ||
      !this.elements ||
      !this.cardElement
    ) {
      this.snackBar.open(
        'Please fill in all required fields and card details.',
        'Close',
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      this.loading = false; // ปิด loading
      return; // หยุดการทำงานถ้าฟอร์มไม่ถูกต้อง หรือ Stripe components ยังไม่พร้อม
    }


    // 3. ดึงข้อมูลจากฟอร์ม
    const { name, email } = this.paymentForm.value; // ดึงค่า name และ email ที่ผู้ใช้กรอก

    try {
      // 4. สร้าง Stripe Token
      // เรียกใช้ StripeService เพื่อสร้าง Token จาก cardElement และชื่อผู้ถือบัตร
      const { token, error } = await this._stripeService.createStripeToken(
        this.cardElement,
        name
      ).toPromise(); // ใช้ .toPromise() เพราะ createStripeToken คืนค่า Observable


      // 5. ตรวจสอบผลการสร้าง Token
      if (error) {
        console.error('Error creating token:', error);

        this.cardErrors = error.message || 'Failed to create payment token.';
        this.snackBar.open(this.cardErrors!, 'Close', { panelClass: ['error-snackbar'] });
        this.loading = false;
        return; // หยุดถ้าสร้าง Token ไม่สำเร็จ
      }
      if (!token) { // กรณีที่ไม่มี error แต่ก็ไม่มี token กลับมา (ไม่น่าจะเกิดขึ้น แต่กันไว้)
        throw new Error('Stripe token not received.');
      }
      


      // 6. ส่ง Token และข้อมูลอื่นๆ ไปยัง Backend เพื่อสร้าง Charge
      // เรียกใช้ StripeService.createCharge เพื่อส่ง Token ID, Order ID และ Email ไปยัง Backend
      const backendResponse = await this._stripeService.createCharge(
        token.id, // ID ของ Token ที่ได้จาก Stripe
        this.orderId // ID ของ Order ที่รับมาจาก Input
      ).toPromise(); // ใช้ .toPromise() เพราะ createCharge คืนค่า Observable
      


      // 7. จัดการผลลัพธ์จาก Backend
      this.loading = false; // ปิด loading
      if (backendResponse && backendResponse.id) { // ถ้า Backend ส่ง ID ของ Payment กลับมา
        this.snackBar.open('Payment successful! Your order has been confirmed.', 'Close', { panelClass: ['success-snackbar'] });
        this.paymentCompleted.emit(true); // <<< แจ้ง Parent Component ว่าชำระเงินสำเร็จ (true)

        this.router.navigate([`orders`, `list`]);
      } else {
        throw new Error('Backend did not return a successful payment ID.'); // Backend ส่งค่าไม่ถูกต้อง
      }

    } catch (backendError: any) { // 8. จัดการข้อผิดพลาดที่เกิดขึ้นในกระบวนการ (รวมถึงจาก Backend)
      this.loading = false; // ปิด loading
      console.error('Payment processing failed:', backendError);

      // พยายามดึงข้อความ Error ที่ชัดเจนที่สุด
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (backendError.error && backendError.error.errors && Array.isArray(backendError.error.errors)) {
        errorMessage = backendError.error.errors[0].message;
      } else if (backendError.error && backendError.error.message) {
        errorMessage = backendError.error.message;
      } else if (backendError.message) {
        errorMessage = backendError.message;
      }

      this.snackBar.open(errorMessage, 'Close', {
        panelClass: ['error-snackbar']
      });
      this.paymentCompleted.emit(false); // <<< แจ้ง Parent Component ว่าชำระเงินล้มเหลว (false)
    }

    
  }

  onCancel(): void {
    this.paymentCancelled.emit(); // แจ้ง Parent ว่ายกเลิก
  }
}
