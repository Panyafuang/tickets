import { importProvidersFrom, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SignupComponent } from './auth/signup/signup.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MaterialModule } from '../material-module';
import { StartComponent } from './start/start.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoggingInterceptor } from './loader/interceptor.service';
import { SigninComponent } from './auth/signin/signin.component';
import { MenubarComponent } from './layout/menubar/menubar.component';
import { SignoutComponent } from './auth/signout/signout.component';
import { TicketComponent } from './ticket/ticket.component';
import { TicketFormComponent } from './ticket/ticket-form/ticket-form.component';
import { TicketListComponent } from './ticket/ticket-list/ticket-list.component';
import { TicketDetailComponent } from './ticket/ticket-detail/ticket-detail.component';
import { OrderComponent } from './order/order.component';
import { OrderDetailComponent } from './order/order-detail/order-detail.component';
import { PaymentDialogComponent } from './dialog/payment-dialog/payment-dialog.component';
import { PaymentFormComponent } from './payment/payment-form/payment-form.component';
import { OrderListComponent } from './order/order-list/order-list.component';
import { SecondsToMmssPipe } from './pipe/seconds-to-mmss.pipe';
import { PaymentStatusComponent } from './payment/payment-status/payment-status.component';
import { provideToastr } from 'ngx-toastr';
import { BusComponent } from './bus/bus.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { SeatComponent } from './bus/seat/seat.component';
import { BookingStepperComponent } from './bus/booking-stepper/booking-stepper.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScheduleComponent } from './bus/schedule/schedule.component';

@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    StartComponent,
    PageNotFoundComponent,
    SigninComponent,
    MenubarComponent,
    SignoutComponent,
    TicketComponent,
    TicketFormComponent,
    TicketListComponent,
    TicketDetailComponent,
    OrderComponent,
    OrderDetailComponent,
    PaymentDialogComponent,
    PaymentFormComponent,
    OrderListComponent,
    SecondsToMmssPipe,
    PaymentStatusComponent,
    BusComponent,
    SeatComponent,
    BookingStepperComponent,
    ScheduleComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  providers: [
    provideAnimations(),
    provideToastr(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true
    },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    importProvidersFrom(HttpClientModule),
    provideAnimationsAsync()// fixed progressbar loading],
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }