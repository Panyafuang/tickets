import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { IBusSchedule } from '../../models/bus-schedule.model';
import { ScheduleService } from '../services/schedule.service';

@Component({
  selector: 'app-schedule-list',
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.css',
})
export class ScheduleListComponent {
  schedules$!: Observable<IBusSchedule[]>;
  displayedColumns: string[] = [
    'routeId',
    'departureTime',
    'price',
    'seats',
    'status',
    'actions',
  ];

  constructor(private _scheduleService: ScheduleService) {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.schedules$ = this._scheduleService.getSchedules();
  }

  onCancel(id: string): void {
    if (
      confirm(
        'Are you sure you want to cancel this schedule? This action cannot be undone.'
      )
    ) {
      this._scheduleService.cancelSchedule(id).subscribe({
        next: () => {
          console.log('Schedule cancelled successfully');
          this.loadSchedules(); // โหลดข้อมูลใหม่เพื่ออัปเดตสถานะในตาราง
        },
        error: (err) => console.error('Failed to cancel schedule', err),
      });
    }
  }
}
