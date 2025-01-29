import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InterviewerComponent } from './interviewer.component';


const routes: Routes = [{
  path: '',
  component: InterviewerComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InterviewerRoutingModule { }
