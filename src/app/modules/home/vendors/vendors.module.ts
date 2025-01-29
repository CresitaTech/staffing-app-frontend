import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { VendorsRoutingModule } from './vendors-routing.module';
import { AddVendorsComponent } from './add-vendors/add-vendors.component';
import { VendorsComponent } from './vendors.component';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { SharedModule } from 'src/app/components/shared-components.module';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DesignationModule } from '../interviewers/designation/designation.module';
import { VendorImportComponent } from './vendor-import/vendor-import.component';
import { VendorTableComponent } from './vendor-table/vendor-table.component';
import { VendorTemplateComponent } from './vendor-template/vendor-template.component';
import { AddVendorTempComponent } from './vendor-template/add-vendor-temp/add-vendor-temp.component';
import { CandidateComponent } from '../candidates/candidate/candidate.component';
import { CandidateModule } from '../candidates/candidate/candidate.module';
import { CreateVendorListComponent } from './create-vendor-list/create-vendor-list.component';
import { VendorListComponent } from './vendor-list/vendor-list.component';
import { VendorTemplateModule } from './vendor-template/vendor-template.module';
import { VendorListDetailsComponent } from './vendor-list/vendor-list-details/vendor-list-details.component';
import { EmailDisplayComponent } from './vendor-list/vendor-list-details/email-display/email-display.component';
import { QuillModule } from 'ngx-quill';

@NgModule({
  declarations: [VendorsComponent, AddVendorsComponent, VendorImportComponent, VendorTableComponent, CreateVendorListComponent, VendorListComponent, VendorListDetailsComponent, EmailDisplayComponent,],
  imports: [
    CommonModule,
    VendorsRoutingModule,
    Ng2SearchPipeModule,
    PipeModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    DesignationModule,
    CandidateModule,
    VendorTemplateModule,
    QuillModule.forRoot()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: []
})
export class VendorsModule { }
