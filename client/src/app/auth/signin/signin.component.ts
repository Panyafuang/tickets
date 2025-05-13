import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

interface IAuthError {
  field: string;
  message: string;
}
@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent implements OnInit {
  signInForm!: FormGroup;
  errorMsg!: IAuthError[];


  constructor(
    private _authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.signInForm = new FormGroup({
      email: new FormControl(''),
      password: new FormControl(''),
    });
  }

  onSubmit() {
    const email = this.signInForm.get('email')?.value;
    const password = this.signInForm.get('password')?.value;
    console.log(email, password);

    this._authService.signin(email, password).subscribe({
      next: (data) => {
        this.router.navigate(['start']);
      },
      error: (err) => {
        this.errorMsg = err.error.errors;
      },
    });
  }
}
