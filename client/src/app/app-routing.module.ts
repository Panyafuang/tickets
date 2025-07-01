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
    // resolve: {
    //   ticket: getTicketByIdResolver
    // }
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
  {
    path: 'start',
    component: StartComponent,
    resolve: {
      getCurrUserResolver,
    },
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
