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
import { NewComponent } from './ticket/new/new.component';

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
    NewComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  providers: [
    provideAnimations(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true
    },
    importProvidersFrom(HttpClientModule),
    provideAnimationsAsync()// fixed progressbar loading],
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }