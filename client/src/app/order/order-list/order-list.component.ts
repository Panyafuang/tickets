import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { IOrder } from '../../models/order.model';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {
  orders: IOrder[] = [];

  constructor(private _orderService: OrderService) { }

  ngOnInit(): void {
    this._orderService.getOrders().subscribe(orders => {
      this.orders = orders;
    });
  }
}
