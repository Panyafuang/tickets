import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-booking-stepper',
  templateUrl: './booking-stepper.component.html',
  styleUrl: './booking-stepper.component.css'
})
export class BookingStepperComponent {
  @Input() currentStep: number = 1;
}
