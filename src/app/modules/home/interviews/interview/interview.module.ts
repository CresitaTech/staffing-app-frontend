import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InterviewRoutingModule } from './interview-routing.module';
import { AddInterviewComponent } from './add-interview/add-interview.component';
// import { FilterInterviewComponent } from './filter-interview/filter-interview.component';
import { InterviewComponent } from './interview.component';

import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { SharedModule } from 'src/app/components/shared-components.module';
import {FormsModule} from '@angular/forms';
import { CandidateModule } from '../../candidates/candidate/candidate.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InterviewerModule } from '../../interviewers/interviewer/interviewer.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { SourceModule } from '../source/source.module';
import { JobDescriptionModule } from '../../job-descriptions/job-description/job-description.module';
import { TimeslotModule } from '../../interviewers/timeslot/timeslot.module';

@NgModule({
  declarations: [InterviewComponent,AddInterviewComponent,
    // FilterInterviewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    InterviewRoutingModule,
    SharedModule,
    PipeModule,
    Ng2SearchPipeModule,
    CandidateModule,
    NgbModule,
    JobDescriptionModule,
    InterviewerModule,
    TimeslotModule,
    SourceModule,
    
  ],
  exports:[AddInterviewComponent,
    // FilterInterviewComponent
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class InterviewModule { }
