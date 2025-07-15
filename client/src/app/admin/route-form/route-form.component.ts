import { Component, OnInit } from '@angular/core';
import { RouteService } from '../../services/routs.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-route-form',
  templateUrl: './route-form.component.html',
  styleUrl: './route-form.component.css'
})
export class RouteFormComponent implements OnInit {
  routeForm!: FormGroup;
  routeId: string | null = null;
  isEditMode: boolean = false;
  errMsgBackend = '';

  constructor(
    private _routeService: RouteService,
    private activateRoute: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('route-from init...')
    this.routeId = this.activateRoute.snapshot.paramMap.get('id');

    console.log(this.routeId)
    this.isEditMode = !!this.routeId;

    this.routeForm = new FormGroup({
      origin: new FormControl('', Validators.required),
      destination: new FormControl('', Validators.required),
      distanceKm: new FormControl(null),
      durationHours: new FormControl(null)
    });

    if (this.routeId && this.isEditMode) {
      this._routeService.getRouteById(this.routeId).subscribe(route => {
        this.routeForm.patchValue(route);
      });
    }
  }

  onSubmit(): void {
    if (this.routeForm.invalid) return;

    const formData = this.routeForm.value;
    if (this.isEditMode && this.routeId) {
      this._routeService.updateRoute(formData, this.routeId).subscribe({
        next: (response) => {
          console.log('updateRoute successful!', response);

          this.snackBar.open('Update route successful', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['admin/routes']);
        },
        error: (err) => {
          console.error('updateRoute failed:', err);

          if (err.error && err.error.message) {
            this.errMsgBackend = err.error.message;
          } else {
            this.errMsgBackend = 'An unexpected error occurred. Please try again.';
          }
        }
      });
    } else {
      this._routeService.createRoute(formData).subscribe({
        next: (response) => {
          console.log('createRoute successful!', response);

          this.snackBar.open('Created route successful', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['admin/routes']);
        },
        error: (err) => {
          console.error('createRoute failed:', err);

          if (err.error && err.error.message) {
            this.errMsgBackend = err.error.message;
          } else {
            this.errMsgBackend = 'An unexpected error occurred. Please try again.';
          }
        }
      });
    }
  }

}