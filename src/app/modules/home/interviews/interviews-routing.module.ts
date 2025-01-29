import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';



const routes: Routes = [{
  path: '',
  children: [{
    path: 'interview',
    loadChildren: () => import('./interview/interview.module').then(m => m.InterviewModule)
  }, {
    path: 'feedback',
    loadChildren: () => import('./feedback/feedback.module').then(m => m.FeedbackModule)
  }, {
    path: 'source',
    loadChildren: () => import('./source/source.module').then(m => m.SourceModule)
  }
]}];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InterviewsRoutingModule { }
