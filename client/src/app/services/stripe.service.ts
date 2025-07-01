import { Injectable } from '@angular/core';
<<<<<<< HEAD
import { loadStripe, Stripe, StripeElements, StripeCardElement, Token, StripeError } from '@stripe/stripe-js';
=======
import { loadStripe, Stripe, StripeCardElement, Token, StripeError } from '@stripe/stripe-js';
>>>>>>> credit-card-payments-not-dialog
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs'; // เพิ่ม from สำหรับ convert Promise เป็น Observable

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise: Promise<Stripe | null>;
  private stripeInstance: Stripe | null = null; // เก็บ instance ของ Stripe

  constructor(private http: HttpClient) {
    this.stripePromise = this.loadStripeInstance();
  }

  private async loadStripeInstance(): Promise<Stripe | null> {
<<<<<<< HEAD
    // return (window as any).Stripe(environment.stripePublicKey);
=======
>>>>>>> credit-card-payments-not-dialog
    if (!this.stripeInstance) {
      try {
        this.stripeInstance = await loadStripe(environment.stripePublicKey);
        if (!this.stripeInstance) {
          console.error('Failed to load Stripe instance');
          return null;
        }
      } catch (error) {
        console.error('Error loading Stripe.js:', error);
        return null;
      }
    }
    return this.stripeInstance;
  }

  // Method สำหรับการเข้าถึง Stripe instance (เมื่อโหลดเสร็จ)
  getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  /**
   * Method สำหรับสร้าง Stripe Token จาก Card Element
   * @param cardElement StripeCardElement ที่ถูก mount แล้ว
   * @param cardHolderName ชื่อเจ้าของบัตร
   * @param cardHolderEmail อีเมลเจ้าของบัตร
   * @returns 
   */
  // createStripeToken(cardElement: StripeCardElement, cardHolderName: string, cardHolderEmail: string): Observable<{ token?: Token, error?: StripeError }> {
<<<<<<< HEAD
  createStripeToken(cardElement: StripeCardElement, cardHolderName: string): Observable<{ token?: Token, error?: StripeError }> {
=======
  createStripeToken(cardElement: StripeCardElement, cardHolderName: string): Observable<{ token?: Token, error?: StripeError } | any> {
>>>>>>> credit-card-payments-not-dialog
    return from(this.getStripe().then(stripe => {
      if (!stripe) {
        throw new Error('Stripe.js not loaded.');
      }
<<<<<<< HEAD
      return stripe.createToken(cardElement, {
        name: cardHolderName // ส่งเฉพาะชื่อ
      });
=======

      const token = stripe.createToken(cardElement, {
        name: cardHolderName // ส่งเฉพาะชื่อ
      });
      return token;
>>>>>>> credit-card-payments-not-dialog
    }));
  }

  // แก้ไขตรงนี้: เพิ่ม cardHolderEmail เป็นพารามิเตอร์
  createCharge(token: string, orderId: string): Observable<any> {
    // ส่ง email ไปยัง Backend เป็น field แยกต่างหากใน request body
    return this.http.post<any>(`/api/payments`, {
      token: token,
      orderId: orderId,
      // email: cardHolderEmail // เพิ่ม email เข้าไปใน payload ที่ส่งให้ Backend
    });
  }
}
