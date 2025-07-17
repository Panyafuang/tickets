import { Component, OnInit } from '@angular/core';
import { BusService } from '../services/bus.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IBusSchedule, ISeatLayoutItem } from '../models/bus-schedule.model';
import { Observable } from 'rxjs';
import { RouteService } from '../services/routs.service';
import { IRoute } from '../models/route.model';

@Component({
  selector: 'app-bus',
  templateUrl: './bus.component.html',
  styleUrl: './bus.component.css'
})
export class BusComponent implements OnInit {
  searchForm!: FormGroup;
  selectedSchedule: IBusSchedule | null = null;
  schedules$!: Observable<IBusSchedule[]>;
  // สำหรับแสดงในตาราง
  displayedColumns: string[] = ['time', 'busType', 'price', 'seatsAvailable', 'actions'];

  allRoutes: IRoute[] = [];
  uniqueOrigins: string[] = [];
  uniqueDestinations: string[] = [];

  constructor(
    private _busService: BusService,
    private _routeService: RouteService
  ) {}

  ngOnInit(): void {
    this.searchForm = new FormGroup({
      origin: new FormControl('', Validators.required),
      destination: new FormControl('', Validators.required),
      travelDate: new FormControl(new Date(), Validators.required)
    });
    this.loadAllRoutes();
  }

  onSearch(): void {
    if (this.searchForm.invalid) return;

    const { origin, destination, travelDate } = this.searchForm.value;

    // แปลง Date object ให้เป็น String YYYY-MM-DD
    const dateString = new Date(travelDate.getTime() - (travelDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

    this.selectedSchedule = null; // Reset การเลือกเมื่อค้นหาใหม่
    this.schedules$ = this._busService.findSchedules(origin, destination, dateString);
  }

  loadAllRoutes(): void {
    this._routeService.getRoutes().subscribe(routes => {
      this.allRoutes = routes;
      // สร้างลิสต์ของ "ต้นทาง" ที่ไม่ซ้ำกัน
      this.uniqueOrigins = [...new Set(routes.map(r => r.origin))].sort();
      // สร้างลิสต์ของ "ปลายทาง" ที่ไม่ซ้ำกัน
      this.uniqueDestinations = [...new Set(routes.map(r => r.destination))].sort();
    });
  }

  onSelectSchedule(schedule: IBusSchedule): void {
    // เมื่อผู้ใช้กด "เลือก" ให้เก็บข้อมูลเที่ยวรถนั้นไว้
    this.selectedSchedule = schedule;
  }

  // เมื่อผู้ใช้เลือกที่นั่งเสร็จใน SeatSelectionComponent
  onBookingConfirmed(selectedSeats: ISeatLayoutItem[]): void {
    console.log('User confirmed booking for seats:', selectedSeats);
    // ณ จุดนี้ คุณสามารถนำทางผู้ใช้ไปยังหน้า Order หรือ Payment ต่อไปได้
  }
}
