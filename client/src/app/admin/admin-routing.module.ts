import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { RouteListComponent } from './route-list/route-list.component';
import { RouteFormComponent } from './route-form/route-form.component';

const routes: Routes = [
  {
    // ถ้าเข้ามาที่ /admin จะให้ redirect ไปที่ /admin/routes
    path: '',
    redirectTo: 'routes',
    pathMatch: 'full'
  },
  {
    // Route สำหรับ /admin/routes
    path: 'routes',
    component: RouteListComponent
  },
  {
    // Route สำหรับ /admin/routes/new
    path: 'routes/new',
    component: RouteFormComponent
  },
  {
    // Route สำหรับ /admin/routes/edit/id
    path: 'route/edit/:id',
    component: RouteFormComponent
  },
  { path: '', component: AdminComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
