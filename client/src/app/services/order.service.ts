import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IOrder } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private http: HttpClient) { }

  orderByTicketId(ticketId: string) {
    return this.http.post<IOrder>(`/api/orders`, { ticketId });
  }

  getOrderDetailById(orderId: string) {
    return this.http.get<IOrder>(`/api/orders/${orderId}`);
  }

  getOrders() {
    return this.http.get<any>(`/api/orders`);
  }
}
