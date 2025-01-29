import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VendorListDetailsComponent } from './vendor-list/vendor-list-details/vendor-list-details.component';
import { VendorListComponent } from './vendor-list/vendor-list.component';
import { VendorTableComponent } from './vendor-table/vendor-table.component';
import { VendorTemplateComponent } from './vendor-template/vendor-template.component';
import { VendorsComponent } from './vendors.component';


const routes: Routes = [{
  path: '',
  component: VendorsComponent
},
{
  path: 'email-template',
  loadChildren: () => import('./../vendors/vendor-template/vendor-template.module').then(m => m.VendorTemplateModule),
},
 {
   path: 'vendor-list',
  component:VendorListComponent
 //loadChildren: () => import('././../../home/vendor/email-template/email-template.module').then(m => m.EmailTemplateModule),
 },
 {
  path: 'vendor-list-details',
  component:VendorListDetailsComponent
 //loadChildren: () => import('././../../home/vendor/email-template/email-template.module').then(m => m.EmailTemplateModule),
},
 
{
  path: 'map-fields',
  component: VendorTableComponent
},
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VendorsRoutingModule { }
