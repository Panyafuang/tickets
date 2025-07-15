import { Component, OnInit } from '@angular/core';
import { RouteService } from '../../services/routs.service';
import { Observable } from 'rxjs';
import { IRoute } from '../../models/route.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-route-list',
  templateUrl: './route-list.component.html',
  styleUrl: './route-list.component.css'
})
export class RouteListComponent implements OnInit {
  routes$!: Observable<IRoute[]>;
  displayedColumns: string[] = ['origin', 'destination', 'distanceKm', 'durationHours', 'actions'];
  errMsgBackEnd: string | null = '';

  constructor(private _routeService: RouteService, private snackBar: MatSnackBar) { }


  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.routes$ = this._routeService.getRoutes();
  }

  onDelete(id: string): void {
    if (confirm("Are you sure you want to delete this route?")) {
      this._routeService.deleteRoute(id).subscribe({
        next: () => {
          this.loadRoutes();
        },
        error: (err) => {
          console.error('Delete route failed: ', err);

          // Handle specific error messages from backend
          if (err.error && err.error.messages) {
            this.errMsgBackEnd = err.error.messages;
          } else {
            this.errMsgBackEnd = 'An unexpected error occurred. Please tryp again.'
          }

          this.snackBar.open(this.errMsgBackEnd!, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          })
        }
      })
    }
  }

}
