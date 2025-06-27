import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Import FormBuilder and FormGroup, Validators
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Ensure this path is correct

interface IAuthError {
  field: string;
  message: string;
}

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  signinForm!: FormGroup; // Use FormGroup for reactive forms
  hidePassword = true;
  errorMessage: string | null = ''; // To display error messages from backend or custom checks

  constructor(
    private fb: FormBuilder, // Inject FormBuilder
    private snackBar: MatSnackBar,
    private router: Router,
    private _authService: AuthService // Inject AuthService
  ) { }

  ngOnInit(): void {
    // Initialize the form with FormBuilder and Validators
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]] // Password is just required for sign-in
    });
  }

  onSubmit(): void {
    this.errorMessage = ''; // Clear any previous backend error messages

    // Mark all fields as touched to display validation errors immediately
    this.signinForm.markAllAsTouched();

    if (this.signinForm.valid) {
      console.log('Attempting sign in with:', this.signinForm.value);

      // Call your AuthService's signIn method
      this._authService.signin(this.signinForm.value.email, this.signinForm.value.password).subscribe({
        next: (response) => {
          console.log('Sign in successful!', response);
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/']); // Redirect to home or dashboard
        },
        error: (err) => {
          console.error('Sign in failed:', err);
          // Handle specific error messages from backend
          if (err.status === 401 || err.status === 403 || err.status === 400) {
            this.errorMessage = 'Invalid email or password.';
          } else if (err.error && err.error.message) {
            this.errorMessage = err.error.message; // Use specific message from backend if available
          } else {
            this.errorMessage = 'An unexpected error occurred. Please try again.';
          }
          this.snackBar.open(this.errorMessage!, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      console.log('Form is invalid (Frontend validation)');
      this.snackBar.open('Please enter your email and password correctly.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }
}