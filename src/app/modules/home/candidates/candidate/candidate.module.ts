import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CandidateComponent } from './candidate.component';
import { AddCandidateComponent } from './add-candidate/add-candidate.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CandidateRoutingModule } from './candidate-routing.module';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { CandidateInlineComponent } from './candidate-inline/candidate-inline.component';
import { CandidateDeleteComponent } from './candidate-delete/candidate-delete.component';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { SharedModule } from 'src/app/components/shared-components.module';
import { DesignationModule } from '../../interviewers/designation/designation.module';
import { JobDescriptionModule } from '../../job-descriptions/job-description/job-description.module';
import { CandidateStagesComponent } from './candidate-stages/candidate-stages.component';
import { CandidateImportComponent } from './candidate-import/candidate-import.component';
import { CandidateTableComponent } from './candidate-table/candidate-table.component';
import { SendMailComponent } from './send-mail/send-mail.component';
import { EmailTemplateModule } from '../email-template/email-template.module';
import { VendorTemplateModule } from '../../vendors/vendor-template/vendor-template.module';
import { StatusUpdateComponent } from './status-update/status-update.component';
import { SubmissionDetailsComponent } from './submission-details/submission-details.component';
import { CandidateReviewMessageComponent } from './candidate-review-message/candidate-review-message.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { CandidateMatchForJobComponent } from './candidate-match-for-job/candidate-match-for-job.component';
import { CandidateImportListComponent } from './candidate-import-list/candidate-import-list.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


@NgModule({
  declarations: [
    CandidateComponent, AddCandidateComponent,
    CandidateInlineComponent, CandidateDeleteComponent, CandidateStagesComponent,
    CandidateImportComponent, CandidateTableComponent, SendMailComponent, StatusUpdateComponent, 
    SubmissionDetailsComponent, CandidateReviewMessageComponent, CandidateMatchForJobComponent, CandidateImportListComponent
   ],
  imports: [
    MatSlideToggleModule,
    CommonModule,
    CandidateRoutingModule,
    JobDescriptionModule,
    DesignationModule,
    HttpClientModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgbModule,
    PipeModule,
    Ng2SearchPipeModule,
    NgMultiSelectDropDownModule,
    EmailTemplateModule,
    VendorTemplateModule,
  ],
  exports: [
    CandidateInlineComponent,
    CandidateStagesComponent,
    AddCandidateComponent,
    CandidateDeleteComponent,
    SendMailComponent,
    StatusUpdateComponent,
    
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CandidateModule { }
