import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { RouteListComponent } from './route-list/route-list.component';
import { RouteFormComponent } from './route-form/route-form.component';
import { MaterialModule } from '../../material-module';


@NgModule({
  declarations: [
    AdminComponent,
    RouteListComponent,
    RouteFormComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    MaterialModule
  ]
})
export class AdminModule { }
