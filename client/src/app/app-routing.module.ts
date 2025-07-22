import { inject, NgModule } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterModule,
  RouterStateSnapshot,
  Routes,
} from '@angular/router';
import { SignupComponent } from './auth/signup/signup.component';
import { StartComponent } from './start/start.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { SigninComponent } from './auth/signin/signin.component';
import { SignoutComponent } from './auth/signout/signout.component';
import { AuthService } from './services/auth.service';
import { TicketComponent } from './ticket/ticket.component';
import { TicketDetailComponent } from './ticket/ticket-detail/ticket-detail.component';
import { TicketService } from './services/ticket.service';
import { OrderComponent } from './order/order.component';
import { OrderDetailComponent } from './order/order-detail/order-detail.component';
import { OrderListComponent } from './order/order-list/order-list.component';
import { PaymentStatusComponent } from './payment/payment-status/payment-status.component';
import { AdminGuard } from './guards/admin.guard';
import { BusComponent } from './bus/bus.component';
import { ScheduleComponent } from './bus/schedule/schedule.component';
import { SeatComponent } from './bus/seat/seat.component';
import { PaymentFormComponent } from './payment/payment-form/payment-form.component';

const getCurrUserResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  return inject(AuthService).getUserDetail();
};

const getTicketByIdResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  return inject(TicketService).getTicketById(route.params['id']);
};

const routes: Routes = [
  { path: '', redirectTo: '/start', pathMatch: 'full' },
  { path: 'auth/signup', component: SignupComponent },
  { path: 'auth/signin', component: SigninComponent },
  { path: 'auth/signout', component: SignoutComponent },
  {
    path: 'tickets',
    component: TicketComponent,
  },
  {
    path: 'tickets/:id',
    component: TicketDetailComponent,
  },
  {
    path: 'orders/list',
    component: OrderListComponent,
  },
  {
    path: 'orders',
    component: OrderComponent,
    children: [
      {
        path: ':id',
        component: OrderDetailComponent,
      },
    ],
  },
  { path: 'payment-status/:clientSecret', component: PaymentStatusComponent },
  {
    path: 'bus',
    component: BusComponent,
    children: [
      {
        path: '',
        redirectTo: 'schedules',
        pathMatch: 'full'
      },
      {
        path: 'schedules',
        component: ScheduleComponent,
        data: { step: 1 } // <-- กำหนดว่าหน้านี้คือขั้นตอนที่ 1
      },
      {
        path: 'seats/:scheduleId',
        component: SeatComponent,
        data: { step: 2 } // <-- กำหนดว่าหน้านี้คือขั้นตอนที่ 2
      },
      {
        path: 'payment',
        component: PaymentFormComponent, 
        data: { step: 3 }
      }
    ]
  },
  {
    path: 'start',
    component: StartComponent,
    resolve: {
      currentUser: getCurrUserResolver,
    },
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AdminGuard],
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
