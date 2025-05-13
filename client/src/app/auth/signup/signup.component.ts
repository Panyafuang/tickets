import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

interface IAuthError {
  field: string;
  message: string;
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  errorMsg!: IAuthError[];

  constructor(
    private fb: FormBuilder,
    private _authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      email: '',
      password: '',
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.signupForm.valid) {
      this._authService
        .signup(this.signupForm.value.email, this.signupForm.value.password)
        .subscribe({
          next: (data) => {
            this.router.navigate(['start']);
          },
          error: (err) => {
            this.errorMsg = err.error.errors;
          },
        });
    }
  }
}
