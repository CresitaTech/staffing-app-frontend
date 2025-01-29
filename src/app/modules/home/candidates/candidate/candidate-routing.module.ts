import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CandidateTableComponent } from './candidate-table/candidate-table.component';
import { CandidateComponent } from './candidate.component';


const routes: Routes = [{
  path: '',
  component: CandidateComponent
},
{
  path:'map-fields',
component:CandidateTableComponent
},
{
  path: 'my-candidates',
  component: CandidateComponent,
},
{
  path: '**',
  redirectTo: '/candidates',
    //pathMatch: 'full',
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CandidateRoutingModule { }
