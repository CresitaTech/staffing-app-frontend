import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RtrComponent } from './rtr.component';


const routes: Routes = [{
    path: '',
    component: RtrComponent,
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RtrRoutingModule { }
