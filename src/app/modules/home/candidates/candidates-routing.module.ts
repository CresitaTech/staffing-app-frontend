import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'candidate',
    loadChildren: () => import('./candidate/candidate.module').then(m => m.CandidateModule)
  },
  {
    path: 'rtr',
    loadChildren: () => import('./rtr/rtr.module').then(m => m.RtrModule),
  },
  {
    path: 'placement',
    loadChildren: () => import('./placement-card/placement-card.module').then(m => m.PlacementCardModule),
  },
  {
    path: 'activity',
    loadChildren: () => import('./activity/activity.module').then(m => m.ActivityModule),
  },
  {
    path: 'email-template',
    loadChildren: () => import('./email-template/email-template.module').then(m => m.EmailTemplateModule),
  },
  {
    path: 'offer-letter',
    loadChildren: () => import('./offer-letter/offer-letter.module').then(m => m.OfferLetterModule),
  },
  {
    path: '',
    redirectTo: 'candidate',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CandidatesRoutingModule { }
