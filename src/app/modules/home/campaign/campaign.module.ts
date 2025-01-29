import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { CampaignRoutingModule } from './campaign-routing.module';
// import { AddCampaignComponent } from './add-campaign/add-campaign.component';
import { CampaignComponent } from './campaign.component';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { SharedModule } from 'src/app/components/shared-components.module';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DesignationModule } from '../interviewers/designation/designation.module';
// import { EmailImportComponent } from './email-import/vendor-import.component';
// import { EmailTableComponent } from './email-table/vendor-table.component';
import { EmailTemplateComponent } from './email-template/email-template.component';
import { AddEmailTempComponent } from './email-template/add-email-temp/add-email-temp.component';
import { CandidateComponent } from '../candidates/candidate/candidate.component';
import { CandidateModule } from '../candidates/candidate/candidate.module';
import { CreateEmailListComponent } from './create-email-list/create-email-list.component';
import { EmailListComponent } from './email-list/email-list.component';
import { CampaignsComponent } from './campaigns/campaigns.component';
import { CampaignDetailsComponent } from './campaigns/campaign-details/campaign-details.component';

import { EmailTemplateModule } from './email-template/email-template.module';
import { CreateEmailCampaignComponent } from './create-email-campaign/create-email-campaign.component';

import { EmailListDetailsComponent } from './email-list/email-list-details/email-list-details.component';
import { EmailDisplayComponent } from './email-list/email-list-details/email-display/email-display.component';
import { QuillModule } from 'ngx-quill';
import { CampaignDisplayComponent } from './campaigns/campaign-details/email-display/campaign-display.component';
import { EmailListModule } from './email-list/email-list.module';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
import { AddCustomFieldsComponent } from './custom-fields/add-custom-fields/add-custom-fields.component';



@NgModule({
  declarations: [CampaignComponent,
    // AddCampaignComponent, 
    // EmailImportComponent, EmailTableComponent,
    CreateEmailCampaignComponent,
    CreateEmailListComponent, 
    EmailDisplayComponent, 
    CampaignsComponent,  
    CampaignDetailsComponent, 
    CampaignDisplayComponent,
    CustomFieldsComponent,
    AddCustomFieldsComponent
  ],
  imports: [
    CommonModule,
    CampaignRoutingModule,
    Ng2SearchPipeModule,
    PipeModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    DesignationModule,
    CandidateModule,
    EmailTemplateModule,
    EmailListModule,
    QuillModule.forRoot()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: []
})
export class CampaignModule { }
