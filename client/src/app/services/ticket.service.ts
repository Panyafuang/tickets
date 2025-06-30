import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ITicket } from '../models/ticket.model';
import { Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  tickets: ITicket[] = [];
  ticketsUpdated = new Subject<ITicket[]>();

  constructor(private http: HttpClient) { }

  private setTicket(tickets: ITicket[]) {
    this.tickets = tickets;
    this.ticketsUpdated.next(this.tickets.slice());
  }

  newTicket(title: string, price: number) {
    return this.http.post<ITicket>(`/api/tickets`, { title, price });
  }

  getTickets() {
    return this.http.get<ITicket[]>(`/api/tickets`).pipe(
      tap(data => this.setTicket(data))
    );
  }

  getTicketById(id: string) {
    return this.http.get<ITicket>(`/api/tickets/${id}`);
  }
}
