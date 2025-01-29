import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SubmissionListComponent } from './submission-list.component';



const routes: Routes = [{
    path: '',
    component: SubmissionListComponent,
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SubmissionListRoutingModule { }
