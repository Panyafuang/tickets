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
  styleUrl: './bus.component.css',
})
export class BusComponent implements OnInit {
  searchForm!: FormGroup;
  selectedSchedule: IBusSchedule | null = null;
  schedules$!: Observable<IBusSchedule[]>;
  // สำหรับแสดงในตาราง
  displayedColumns: string[] = [
    'time',
    'busType',
    'price',
    'seatsAvailable',
    'actions',
  ];

  allRoutes: IRoute[] = [];
  uniqueOrigins: string[] = [];
  uniqueDestinations: string[] = [];
  filteredDestinations: string[] = [];

  constructor(
    private _busService: BusService,
    private _routeService: RouteService
  ) {}

  ngOnInit(): void {
    this.searchForm = new FormGroup({
      origin: new FormControl('', Validators.required),
      destination: new FormControl('', Validators.required),
      travelDate: new FormControl(new Date(), Validators.required),
    });
    this.loadAllRoutes();

    // กรองปลายทางแบบไดนามิกเปลี่ยนไปตาม ต้นทางที่เลือก
    this.searchForm.get('origin')?.valueChanges.subscribe((selectedOrigin) => {
      this.filteredDestinations = [
        ...new Set(
          this.allRoutes
            .filter((r) => r.origin === selectedOrigin)
            .map((r) => r.destination)
        ),
      ].sort();
      this.searchForm.get('destination')?.reset();
    });
  }

  onSearch(): void {
    if (this.searchForm.invalid) return;

    const { origin, destination, travelDate } = this.searchForm.value;

    // แปลง Date object ให้เป็น String YYYY-MM-DD
    const dateString = new Date(
      travelDate.getTime() - travelDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split('T')[0];

    this.selectedSchedule = null; // Reset การเลือกเมื่อค้นหาใหม่
    this.schedules$ = this._busService.findSchedules(
      origin,
      destination,
      dateString
    );
  }

  loadAllRoutes(): void {
    this._routeService.getRoutes().subscribe((routes) => {
      this.allRoutes = routes;
      // สร้างลิสต์ของ "ต้นทาง" ที่ไม่ซ้ำกัน
      this.uniqueOrigins = [...new Set(routes.map((r) => r.origin))].sort();
      // สร้างลิสต์ของ "ปลายทาง" ที่ไม่ซ้ำกัน
      this.uniqueDestinations = [
        ...new Set(routes.map((r) => r.destination)),
      ].sort();
    });
  }

  onSelectSchedule(schedule: IBusSchedule): void {
    this.selectedSchedule = schedule;
  }

  /**
   * ถูกเรียกเมื่อผู้ใช้กดยืนยันการจองจาก seat-selection component
   * @param event ข้อมูลที่ส่งมาจาก child component
   */
  onBookingSubmit(event: {
    passengerData: any;
    selectedSeats: ISeatLayoutItem[];
  }): void {
    console.log('Parent received booking submission:');
    console.log('Passenger Data:', event.passengerData);
    console.log('Selected Seats:', event.selectedSeats);

    // ณ จุดนี้ คุณสามารถนำข้อมูลไปสร้าง Order ต่อไปได้
    // เช่น this.router.navigate(['/orders/new'], { state: { ...event, scheduleId: this.selectedSchedule?.id } });
  }

  /**
   * ถูกเรียกเมื่อผู้ใช้กดย้อนกลับจากหน้าเลือกที่นั่ง
   */
  onGoBack(): void {
    this.selectedSchedule = null;
  }
}
