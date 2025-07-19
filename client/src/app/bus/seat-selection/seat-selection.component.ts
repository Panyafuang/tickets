import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IBusSchedule, ISeatLayoutItem } from '../../models/bus-schedule.model';

@Component({
  selector: 'app-seat-selection',
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css'
})
export class SeatSelectionComponent implements OnInit {
  @Input() schedule: IBusSchedule | null = null;

  passengerForm!: FormGroup;
  selectedSeats: ISeatLayoutItem[] = []; // เลือกได้หลายที่นั่ง

  constructor() {}

  ngOnInit(): void {
    this.passengerForm = new FormGroup({
      fullName: new FormControl(['', Validators.required]),
      phoneNumber: new FormControl(['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]),
      email: new FormControl(['', [Validators.required, Validators.email]])
    });
  }


  
}
