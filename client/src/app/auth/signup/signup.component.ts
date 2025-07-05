import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar'; // เพิ่ม MatSnackBar
import { IBackEndError } from '../../models/backend-error.model';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'], // เปลี่ยน styleUrl เป็น styleUrls
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup; // ใช้ ! เพื่อบอกว่ามันจะถูก initialize ใน ngOnInit
  backendErrors: IBackEndError[] = []; // เปลี่ยนชื่อจาก errorMsg เพื่อความชัดเจนว่ามาจาก backend
  hidePassword = true; // สำหรับปุ่มแสดง/ซ่อนรหัสผ่าน

  constructor(
    private fb: FormBuilder,
    private _authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) { }

  ngOnInit() {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      sex: ['', [Validators.required]],
      tel: ['', [Validators.required, Validators.pattern(/^[0-9]{9,10}$/)]] // สำหรับเบอร์โทรศัพท์ 9-10 หลัก
    });
  }

  // Helper method to check if a specific backend error exists for a field
  getBackendErrorForField(fieldName: string): string | null {
    const error = this.backendErrors.find(err => err.field === fieldName);
    return error ? error.message : null;
  }

  // Helper method to get general backend errors (not tied to a specific field)
  getGeneralBackendErrors(): IBackEndError[] {
    return this.backendErrors.filter(err => !err.field);
  }

  onSubmit() {
    console.log('onsubmit...')

    this.backendErrors = []; // Clear previous backend errors on new submission

    // Mark all form fields as touched to display frontend validation errors
    this.signupForm.markAllAsTouched();

    if (this.signupForm.valid) {
      const { email, password, firstname, lastname, sex, tel } = this.signupForm.value;

      this._authService
        .signup(email, password, firstname, lastname, sex, tel)
        .subscribe({
          next: (data) => {
            console.log('Signup successful:', data);
            this.snackBar.open('Registration successful! Please sign in.', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/auth/signin']); // เปลี่ยนเป็นไปหน้า signin หลังสมัครสำเร็จ
          },
          error: (err) => {
            console.error('Signup failed:', err);
            if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
              this.backendErrors = err.error.errors; // รับ error array จาก backend
            } else if (err.error && err.error.message) {
              // กรณี backend ส่ง error เป็น message เดี่ยวๆ ไม่ใช่ array
              this.backendErrors = [{ message: err.error.message }];
            } else {
              this.backendErrors = [{ message: 'An unexpected error occurred. Please try again.' }];
            }

            // แสดง error ผ่าน snackbar สำหรับ error ทั่วไป --> // กรณี backend ส่ง error เป็น message เดี่ยวๆ ไม่ใช่ array
            if (this.backendErrors.length > 0) {
              const generalErrors = this.getGeneralBackendErrors();
              if (generalErrors.length > 0) {
                this.snackBar.open(generalErrors[0].message, 'Close', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
              }
            }
          },
        });
    } else {
      console.log('Frontend validation failed.');
      this.snackBar.open('Please correct the errors in the form.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }
}