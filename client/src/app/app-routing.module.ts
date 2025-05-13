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

const getCurrUserResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  return inject(AuthService).getUserDetail();
};

const routes: Routes = [
  { path: '', redirectTo: '/start', pathMatch: 'full' },
  { path: 'auth/signup', component: SignupComponent },
  { path: 'auth/signin', component: SigninComponent },
  { path: 'auth/signout', component: SignoutComponent },
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
