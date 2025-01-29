import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CandidateRepositoryComponent } from './candidate-repository.component';


const routes: Routes = [{
    path: '',
    component: CandidateRepositoryComponent,
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CandidateRepositoryRoutingModule { }
