import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ErrorPageComponent } from './components/error-page/error-page.component';


const routes: Routes = [{
  path: 'home',
  // canActivateChild: [LoginGuard],
  loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule)
}, {
  path: 'login',
  loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule)
},
{
  path: 'forgot-password',
  loadChildren: () => import('./modules/forgot-password/forgot-password.module').then(m => m.ForgotPasswordModule)
},
{
  path: 'reset-password',
  loadChildren: () => import('./modules/reset-password/reset-password.module').then(m => m.ResetPasswordModule)
}, {
  path: '404',
  component: ErrorPageComponent
}, {
  path: '',
  redirectTo: '/login',
  pathMatch: 'full'
},
{
  path: '',
  redirectTo: '/forgot-password',
  pathMatch: 'full'
},
{
  path: '',
  redirectTo: '/password_reset',
  pathMatch: 'full'
}, {
  path: '**',
  redirectTo: '/404'
}]



@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
