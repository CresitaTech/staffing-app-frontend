import { CUSTOM_ELEMENTS_SCHEMA, NgModule, Pipe } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddSubmissionComponent } from './add-submission/add-submission.component';
// import { FilterSubmissionComponent } from './filter-submission/filter-submission.component';
import { SubmissionListComponent } from './submission-list.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared-components.module';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { SubmissionListRoutingModule } from './submission-list-routing.module';
import { UserModule } from '../../user/user.module';
import { CandidateModule } from '../../candidates/candidate/candidate.module';
import { PipeModule } from 'src/app/pipes/pipe.module';



@NgModule({
  declarations: [AddSubmissionComponent, 
    // FilterSubmissionComponent,
    SubmissionListComponent],
  imports: [
    CommonModule,
    SubmissionListRoutingModule,
    Ng2SearchPipeModule,
    FormsModule,
    SharedModule,
    CandidateModule,
    UserModule,
    PipeModule
 ],
    schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class SubmissionListModule { }
