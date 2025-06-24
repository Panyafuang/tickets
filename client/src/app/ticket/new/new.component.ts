import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrl: './new.component.css'
})
export class NewComponent implements OnInit {
  newTicketForm!: FormGroup;

  constructor() {}


  ngOnInit(): void {
    this.newTicketForm = new FormGroup({
      title: new FormControl('', Validators.required),
      price: new FormControl('', Validators.required)
    });
  }

  onSubmit() {

  }
}
