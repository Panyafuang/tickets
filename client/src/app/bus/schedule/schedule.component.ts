import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { IBusSchedule } from '../../models/bus-schedule.model';
import { IRoute } from '../../models/route.model';
import { BusService } from '../../services/bus.service';
import { RouteService } from '../../services/routs.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
})
export class ScheduleComponent implements OnInit {
  searchForm!: FormGroup;
  schedules$!: Observable<IBusSchedule[]>; 

  allRoutes: IRoute[] = [];
  uniqueOrigins: string[] = [];
  filteredDestinations: string[] = [];

  searchedOrigin: string = '';
  searchedDestination: string = '';

  constructor(
    private _busService: BusService,
    private _routeService: RouteService,
    private router: Router
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
      // ล้างค่า "จุดหมายปลายทาง" ที่เลือกไว้ เมื่อต้นทางเปลี่ยน
      this.searchForm.get('destination')?.reset();
    });
  }

  onSearch(): void {
    // เพิ่มการตรวจสอบว่าฟอร์มถูกต้องหรือไม่ก่อนค้นหา
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched(); // แสดง error ถ้ายังกรอกไม่ครบ
      return;
    }

    const { origin, destination, travelDate } = this.searchForm.value;
    this.searchedOrigin = origin;
    this.searchedDestination = destination;
    const dateString = new Date(travelDate.getTime() - travelDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    this.schedules$ = this._busService.findSchedules(origin, destination, dateString);
  }

  loadAllRoutes(): void {
    this._routeService.getRoutes().subscribe((routes) => {
      this.allRoutes = routes;
      this.uniqueOrigins = [...new Set(routes.map((r) => r.origin))].sort();
      this.filteredDestinations = [
        ...new Set(routes.map((r) => r.destination)),
      ].sort();
    });
  }

  /**
   * แก้ไขฟังก์ชันนี้ให้ใช้ Router
   */
  onSelectSchedule(schedule: IBusSchedule): void {
    this.router.navigate(['/bus/seats', schedule.id]); 
  }
  
  calculateDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();

    if (isNaN(diffMs) || diffMs < 0) {
        return 'N/A';
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMins}m`;
  }
  
}