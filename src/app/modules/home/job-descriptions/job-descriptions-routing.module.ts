import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CustomJobFieldsComponent } from './job-custom-fields/job-custom-fields.component';

const routes: Routes = [{
  path: 'job-description',
  loadChildren: () => import('./job-description/job-description.module').then(m => m.JobDescriptionModule)
}, {
  path: 'assignment-list',
  loadChildren: () => import('./assignment-list/assignment-list.module').then(m => m.AssignmentListModule),
}, {
  path: 'submission-list',
  loadChildren: () => import('./submission-list/submission-list.module').then(m => m.SubmissionListModule),
}, 

{
  path: 'job-custom-fields',
  component:CustomJobFieldsComponent
},

{
  path: 'job-email-template',
  loadChildren: () => import('./job-email-template/job-email-template.module').then(m => m.JobEmailTemplateModule),
},

{
  path: '',
  redirectTo: '/job-description',
  pathMatch: 'full'
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobDescriptionsRoutingModule { }
