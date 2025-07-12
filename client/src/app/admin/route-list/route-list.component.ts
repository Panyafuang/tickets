import { Component, OnInit } from '@angular/core';
import { RoutsService } from '../../services/routs.service';
import { Observable } from 'rxjs';
import { IRoute } from '../../models/route.model';

@Component({
  selector: 'app-route-list',
  templateUrl: './route-list.component.html',
  styleUrl: './route-list.component.css'
})
export class RouteListComponent implements OnInit {
  routes$!: Observable<IRoute[]>;
  displayedColumns: string[] = ['origin', 'destination', 'actions'];

  constructor(private _routeService: RoutsService) {}


  ngOnInit(): void {
    
  }

  loadRoutes(): void {
    this.routes$ = this._routeService.getRoutes();
  }

  onDelete(id: string): void {
    if(confirm("Are you sure you want to delete this route?")) {
      this._routeService.deleteRoute(id).subscribe({
        next: () => {
          this.loadRoutes();
        },
        error: (err) => {
          console.error(err);
        }
      })
    }
  }

}
