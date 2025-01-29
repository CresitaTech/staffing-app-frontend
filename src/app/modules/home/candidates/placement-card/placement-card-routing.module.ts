import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlacementCardComponent } from './placement-card.component';


const routes: Routes = [{
    path: '',
    component: PlacementCardComponent,
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlacementCardRoutingModule { }
