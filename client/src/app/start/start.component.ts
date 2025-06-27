import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { IUser } from '../models/user.model';
import { Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';


@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrl: './start.component.css',
})
export class StartComponent implements OnInit, OnDestroy {
  currUser!: IUser | null | undefined;
  currUserSub!: Subscription;
  searchForm!: FormGroup;

  constructor(
    private _authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // this._authService.getUserDetail();
    this.currUserSub = this._authService.userUpdated.subscribe(data => {
      this.currUser = data;
    });
    this.searchForm = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      travelDate: [new Date(), Validators.required], // Default to today
      passengers: [1, [Validators.required, Validators.min(1)]] // Default to 1 passenger
    });
  }

  onSearchSubmit(): void {
    if (this.searchForm.valid) {
      console.log('Search Form Submitted!', this.searchForm.value);
      // TODO: Implement actual search logic, e.g., navigate to search results page
      // Example: this.router.navigate(['/search-results'], { queryParams: this.searchForm.value });
      this.snackBar.open('Searching for tickets...', 'Close', { duration: 2000 });
    } else {
      this.searchForm.markAllAsTouched();
      this.snackBar.open('Please fill in all search criteria.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  ngOnDestroy() {
    this.currUserSub.unsubscribe();
  }
}
