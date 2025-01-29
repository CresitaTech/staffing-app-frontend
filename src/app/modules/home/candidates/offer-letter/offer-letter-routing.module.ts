import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OfferLetterComponent } from './offer-letter.component';

const routes: Routes = [{
  path: '',
  component: OfferLetterComponent
},
{
  path: '**',
  redirectTo: '/candidates',
  //pathMatch: 'full',
}];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OfferLetterRoutingModule { }
