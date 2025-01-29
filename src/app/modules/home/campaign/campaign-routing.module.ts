import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EmailListDetailsComponent } from './email-list/email-list-details/email-list-details.component';
import { EmailListComponent } from './email-list/email-list.component';
// import { EmailTableComponent } from './email-table/email-table.component';
import { EmailTemplateComponent } from './email-template/email-template.component';
import { CampaignComponent } from './campaign.component';
import { CampaignsComponent } from './campaigns/campaigns.component';
import { CampaignDetailsComponent } from './campaigns/campaign-details/campaign-details.component';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
const routes: Routes = [{
  path: '',
  component: CampaignComponent
},
{
  path: 'email-template',
  loadChildren: () => import('./email-template/email-template.module').then(m => m.EmailTemplateModule),
},
 {
   path: 'email-list',
  component:EmailListComponent
 //loadChildren: () => import('././../../home/email/email-template/email-template.module').then(m => m.EmailTemplateModule),
 },
 {
   path: 'custom-fields',
   component:CustomFieldsComponent
  //loadChildren: () => import('././../../home/email/email-template/email-template.module').then(m => m.EmailTemplateModule),
 },
 {
  path: 'campaigns',
 component:CampaignsComponent
//loadChildren: () => import('././../../home/email/email-template/email-template.module').then(m => m.EmailTemplateModule),
},
 {
  path: 'email-list-details',
  component:EmailListDetailsComponent
 //loadChildren: () => import('././../../home/email/email-template/email-template.module').then(m => m.EmailTemplateModule),
},
{
  path: 'campaign-details',
  component:CampaignDetailsComponent
 //loadChildren: () => import('././../../home/email/email-template/email-template.module').then(m => m.EmailTemplateModule),
}
 
 
// {
//   path: 'map-fields',
//   component: EmailTableComponent
// },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CampaignRoutingModule { }
