import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { IBackEndError } from '../../models/backend-error.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ticket-form',
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.css'
})
export class TicketFormComponent implements OnInit {
  ticketForm!: FormGroup;
  backendError: IBackEndError[] = [];


  constructor(private _ticketService: TicketService, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.ticketForm = new FormGroup({
      title: new FormControl('', Validators.required),
      price: new FormControl('', Validators.required)
    });
  }

  getGeneralBackendErrors(): IBackEndError[] {
    return this.backendError.filter(err => !err.field);
  }

  onSubmit(): void {
    console.log(this.ticketForm.value);
    this.backendError = []; // clear previous backend errors on new submission

    // if (!this.ticketForm.valid) return;
    const { title, price } = this.ticketForm.value;
    this._ticketService.newTicket(title, price).subscribe({
      next: (data) => {
        this._ticketService.getTickets().subscribe({
          next: () => { },
          error: (err) => { }
        });
      },
      error: (err) => {
        console.log("🚀 ~ TicketFormComponent ~ this._ticketService.newTicket ~ err:", err)

        if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
          this.backendError = err.error.errors;
        } else if (err.error && err.error.message) {
          this.backendError = [
            { message: err.error.message }
          ]
        } else {
          this.backendError = [
            { message: 'An unexpected error occurred. Please try again. ' }
          ]
        }

        // แสดง error ผ่าน snackbar สำหรับ error ทั่วไป
        if (this.backendError.length > 0) {
          const generalErrors = this.getGeneralBackendErrors();
          if (generalErrors.length > 0) {
            this.snackBar.open(generalErrors[0].message, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
      }
    });
  }

}
