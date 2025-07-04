import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement, Token, StripeError, PaymentIntent } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs'; // เพิ่ม from สำหรับ convert Promise เป็น Observable


interface IPaymentIntent {
  clientSecret: string;
  paymentIntentId: string
}


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
   * Method สำหรับสร้าง Stripe Token จาก Card Element // เมธอดเดิมสำหรับสร้าง Card Token (ยังคงใช้ได้สำหรับบัตรเครดิต)
   * @param cardElement StripeCardElement ที่ถูก mount แล้ว
   * @param cardHolderName ชื่อเจ้าของบัตร
   */
  createStripeToken(cardElement: StripeCardElement, cardHolderName: string): Observable<{ token?: Token, error?: StripeError } | any> {
    return from(this.getStripe().then(stripe => {
      if (!stripe) {
        throw new Error('Stripe.js not loaded.');
      }

      const token = stripe.createToken(cardElement, {
        name: cardHolderName // ส่งเฉพาะชื่อ
      });
      return token;
    }));
  }

  // เมธอดเดิมสำหรับสร้าง Charge (จะใช้สำหรับ Card Token)
  createCharge(token: string, orderId: string): Observable<any> {
    // ส่ง email ไปยัง Backend เป็น field แยกต่างหากใน request body
    return this.http.post<any>(`/api/payments`, {
      token: token,
      orderId: orderId,
    });
  }


  // *** เมธอดใหม่สำหรับ Payment Intents ***
  // 1. สร้าง Payment Intent ที่ Backend
  createPaymentIntent(orderId: string): Observable<IPaymentIntent> {
    return this.http.post<IPaymentIntent>(`/api/payments/create-payment-intent`, { orderId });
  }

  // 2. ยืนยัน PromptPay Payment บน Frontend
  confirmPromptPayPayment(clientSecret: string, name: string, email: string): Observable<{ paymentIntent?: PaymentIntent, error?: StripeError } | any> {
    return from(this.getStripe().then(async stripe => {
      if (!stripe) {
        throw new Error('Stripe.js not loaded.');
      }

      // เพิ่ม return_url เข้าไปใน confirmParams
      return (stripe.confirmPayment as any)({
        clientSecret: clientSecret,
        confirmParams: {
          payment_method_data: {
            type: 'promptpay',
            billing_details: {
              name: name,
              email: email
            }
          },

          // URL ของหน้าเพจในแอปพลิเคชัน Angular ของคุณที่แสดงผลลัพธ์การชำระเงิน
          // ตัวอย่างเช่น หน้า Order Success หรือ Payment Status
          return_url: window.location.origin + '/payment-status/' + clientSecret // หรือ URL ที่เหมาะสมกับแอปของคุณ
        } as any // ยังคง as any ไว้ เพราะเราเปลี่ยนโครงสร้างภายใน confirmParams.payment_method_data
      });
    }));
  }

  // 3. ยืนยัน Card Payment บน Frontend (ใช้สำหรับ Payment Intents ด้วย)
  confirmCardPayment(clientSecret: string, cardElement: StripeCardElement, cardHolderName: string, cardHolderEmail: string): Observable<{
    paymentIntent?: PaymentIntent, error?: StripeError
  } | any> {
    return from(this.getStripe().then(async stripe => {
      if (!stripe) {
        throw new Error('Stripe.js not loaded.');
      }

      return stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardHolderName,
            email: cardHolderEmail
          }
        }
      });
    }));
  }

}
