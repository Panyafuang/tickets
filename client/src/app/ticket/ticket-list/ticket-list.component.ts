import { Component, OnDestroy, OnInit } from '@angular/core';
import { TicketService } from '../../services/ticket.service';
import { ITicket } from '../../models/ticket.model';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.css'
})
export class TicketListComponent implements OnInit, OnDestroy {
  tickets: ITicket[] = [];
  ticketsSub: Subscription = new Subscription();

  constructor(
    private _ticketService: TicketService,
    private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this._ticketService.getTickets().subscribe({
      next: () => { },
      error: (err) => { }
    });

    this.ticketsSub = this._ticketService.ticketsUpdated.subscribe(tickets => {
      this.tickets = tickets;
    });

  }

  onViewTicketDetail(id: string) {
    // this.router.navigate([`/tickets/${id}`], {
    //   relativeTo: this.route
    // });

    // Open Dialog ticket detail
    
  }

  ngOnDestroy(): void {
    this.ticketsSub.unsubscribe();
  }
}
