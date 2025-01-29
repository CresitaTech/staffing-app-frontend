import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResetPassword } from './reset-password.component';
import { RouterModule, Routes } from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule} from '@angular/common/http';

const routes: Routes = [{
  path: '',
  component: ResetPassword,
}];

@NgModule({
  declarations: [ResetPassword],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    HttpClientModule
  ]
})
export class ResetPasswordModule { }
