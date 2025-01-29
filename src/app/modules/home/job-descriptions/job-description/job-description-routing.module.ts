import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JdTableComponent } from './jd-table/jd-table.component';
import { JobDescriptionComponent } from './job-description.component';


const routes: Routes = [{
  path: '',
  component: JobDescriptionComponent,
},
{
  path: 'myjobs',
  component: JobDescriptionComponent,
},
{
  path: 'alljobs',
  component: JobDescriptionComponent,
},
{
  path: 'filterjobs',
  component: JobDescriptionComponent,
},
  {
    path:'map-fields',
  component:JdTableComponent
  
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobDescriptionRoutingModule { }
