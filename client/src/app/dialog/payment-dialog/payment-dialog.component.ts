import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common'; // สำหรับ *ngIf
import { StripeCardElement, StripeElements, Stripe } from '@stripe/stripe-js';
import { StripeService } from '../../services/stripe.service'; // Path ไปยัง StripeService ของคุณ
import { IUser } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-payment-dialog',
  templateUrl: './payment-dialog.component.html',
  styleUrls: ['./payment-dialog.component.css'],
})
export class PaymentDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  paymentForm!: FormGroup;
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;

  loading = false;
  cardErrors: string | null = null; // สำหรับแสดง error ของ Card Element

  orderId: string;
  orderPrice: number;
  email: string;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private stripeService: StripeService,
    private _authService: AuthService,
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orderId: string; price: number, email: string }
  ) {
    this.orderId = data.orderId;
    this.orderPrice = data.price;
    this.email = data.email;
  }

  ngOnInit(): void {
    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      email: [this.email, [Validators.required, Validators.email]],
    });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      this.stripe = await this.stripeService.getStripe();
      if (this.stripe) {
        this.elements = this.stripe.elements();

        if (this.elements) {
          this.cardElement = this.elements.create('card', {
            style: {
              base: {
                iconColor: '#666EE8',
                color: '#313259',
                fontWeight: '300',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSize: '18px',
                '::placeholder': {
                  color: '#CFD7E0'
                }
              },
              invalid: { // ตรวจสอบว่ามี invalid style ที่ถูกต้อง
                color: '#fa755a',
                iconColor: '#fa755a'
              }
            }
          });

          // ตรวจสอบว่า cardElementRef.nativeElement มีอยู่จริง
          if (this.cardElementRef && this.cardElementRef.nativeElement) {
            this.cardElement.mount(this.cardElementRef.nativeElement);
            console.log('Stripe Card Element mounted successfully.');
          } else {
            console.error('cardElementRef.nativeElement is not available.');
            this.snackBar.open('Error: Card element container not found.', 'Close', { panelClass: ['error-snackbar'] });
            this.dialogRef.close(false);
            return;
          }

          this.cardElement.on('change', (event) => {
            this.cardErrors = event.error ? event.error.message : null;
          });
        } else {
          console.error('Stripe Elements could not be created.');
          this.snackBar.open('Failed to initialize Stripe Elements.', 'Close', { panelClass: ['error-snackbar'] });
          this.dialogRef.close(false);
        }
      } else {
        console.error('Stripe instance could not be loaded.');
        this.snackBar.open('Failed to load Stripe. Please try again.', 'Close', { panelClass: ['error-snackbar'] });
        this.dialogRef.close(false);
      }
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      this.snackBar.open('Error initializing payment. Check console.', 'Close', { panelClass: ['error-snackbar'] });
      this.dialogRef.close(false);
    }
  }

  ngOnDestroy(): void {
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    this.cardErrors = null;

    this.paymentForm.markAllAsTouched();

    if (this.paymentForm.invalid || !this.stripe || !this.elements || !this.cardElement) {
      this.snackBar.open('Please fill in all required fields and card details.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      this.loading = false;
      return;
    }

    const { name, email } = this.paymentForm.value; // ดึง name และ email จากฟอร์ม

    try {
      // 1. Create Stripe Token from Card Element (ส่งเฉพาะ name)
      const { token, error } = await this.stripeService.createStripeToken(
        this.cardElement,
        name // ส่งเฉพาะชื่อ
      ).toPromise();

      if (error) {
        console.error('Error creating token:', error);
        this.cardErrors = error.message || 'Failed to create payment token.';
        this.snackBar.open(this.cardErrors!, 'Close', { panelClass: ['error-snackbar'] });
        this.loading = false;
        return;
      }

      if (!token) {
        throw new Error('Stripe token not received.');
      }

      // 2. Send token.id, orderId และ email ไปยัง Backend
      const backendResponse = await this.stripeService.createCharge(
        token.id,
        this.orderId,
        // email // ส่ง email ไปยัง Backend
      ).toPromise();

      this.loading = false;

      if (backendResponse && backendResponse.id) {
        this.snackBar.open('Payment successful! Your order has been confirmed.', 'Close', { panelClass: ['success-snackbar'] });
        this.dialogRef.close(true);
      } else {
        throw new Error('Backend did not return a successful payment ID.');
      }

    } catch (backendError: any) {
      this.loading = false;
      console.error('Payment processing failed:', backendError);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (backendError.error && backendError.error.errors && backendError.error.errors.length > 0) {
        errorMessage = backendError.error.errors[0].message;
      } else if (backendError.error && backendError.error.message) {
        errorMessage = backendError.error.message;
      } else if (backendError.message) {
        errorMessage = backendError.message;
      }

      this.snackBar.open(errorMessage, 'Close', { panelClass: ['error-snackbar'] });
      this.dialogRef.close(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false); // ปิด Dialog โดยไม่ทำอะไร
  }
}