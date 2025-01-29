import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InterviewerRoutingModule } from './interviewer-routing.module';
import { InterviewerComponent } from './interviewer.component';
import { InterviewerInlineComponent } from './interviewer-inline/interviewer-inline.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddInterviewerComponent } from './add-interviewer/add-interviewer.component';
import { SharedModule } from 'src/app/components/shared-components.module';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { DesignationModule } from '../designation/designation.module';
import { TimeslotModule } from '../timeslot/timeslot.module';


@NgModule({
  declarations: [InterviewerComponent,InterviewerInlineComponent, AddInterviewerComponent],
  imports: [
    CommonModule,
    InterviewerRoutingModule,
    FormsModule,
    NgSelectModule,
    SharedModule,
    PipeModule,
    Ng2SearchPipeModule,
    DesignationModule,
    TimeslotModule,
  ],
  exports: [InterviewerInlineComponent]
})
export class InterviewerModule { }
