import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [{
  path: '',
  children: [{
    path: 'designation',
    loadChildren: () => import('./designation/designation.module').then(m => m.DesignationModule)
  }, {
    path: 'interviewer',
    loadChildren: () => import('./interviewer/interviewer.module').then(m => m.InterviewerModule)
  }, {
    path: '',
    redirectTo: 'designation',
    pathMatch: 'full'
  }]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InterviewersRoutingModule { }
