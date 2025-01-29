import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OfferLetterRoutingModule } from './offer-letter-routing.module';
import { AddOfferLetterComponent } from './add-offer-letter/add-offer-letter.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared-components.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { JobDescriptionModule } from '../../job-descriptions/job-description/job-description.module';
import { OfferLetterComponent } from './offer-letter.component';
import { CandidateModule } from '../candidate/candidate.module';


@NgModule({
  declarations: [
    AddOfferLetterComponent, OfferLetterComponent
  ],
  imports: [
    CommonModule,
    OfferLetterRoutingModule,
    FormsModule,
    SharedModule,
    CandidateModule,
    NgSelectModule,
    PipeModule,
    Ng2SearchPipeModule,
    NgbModule,
    JobDescriptionModule
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class OfferLetterModule { }
