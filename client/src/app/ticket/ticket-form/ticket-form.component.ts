import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ticket-form',
  templateUrl: './ticket-form.component.html',
  styleUrl: './ticket-form.component.css'
})
export class TicketFormComponent implements OnInit {
  ticketForm!: FormGroup;

  constructor() {}

  ngOnInit(): void {
    this.ticketForm = new FormGroup({
      title: new FormControl('', Validators.required),
      price: new FormControl('', Validators.required)
    });
  }

  onSubmit(): void {
    console.log(this.ticketForm.value);
  }

}
