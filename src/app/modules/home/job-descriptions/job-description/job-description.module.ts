import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobDescriptionRoutingModule } from './job-description-routing.module';
import { JobDescriptionComponent } from './job-description.component';
import { JobDescriptionDetailComponent } from './job-description-detail/job-description-detail.component';
import { JobDescriptionInlineComponent } from './job-description-inline/job-description-inline.component';
import { JobDescriptionDeleteComponent } from './job-description-delete/job-description-delete.component';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared-components.module';
import { ClientsModule } from '../../clients/clients.module';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { UserModule } from '../../user/user.module';
import { JdImportComponent } from './jd-import/jd-import.component';
import { JdTableComponent } from './jd-table/jd-table.component';
import { AssignmentHistoryComponent } from './assignment-history/assignment-history.component';
import { AgGridModule } from 'ag-grid-angular';
import { JobDescriptionNotesComponent } from './job-description-notes/job-description-notes.component';
import { JobMatchCandidatesComponent } from './job-match-candidates/job-match-candidates.component';
import { JobDescriptionDetailsDialogComponent } from './job-description-details-dialog/job-description-details-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


@NgModule({
  declarations: [JobDescriptionComponent, JobDescriptionDetailComponent, 
    JobDescriptionInlineComponent, JobDescriptionDeleteComponent,JdImportComponent,JobDescriptionDetailsDialogComponent,
    JdTableComponent, AssignmentHistoryComponent, JobDescriptionNotesComponent,
  JobMatchCandidatesComponent],
  imports: [
    MatSlideToggleModule,
    CommonModule,
    JobDescriptionRoutingModule,
    ClientsModule,
    UserModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    NgbModule,
    PipeModule,
    Ng2SearchPipeModule,
    AgGridModule.withComponents([]),
    ReactiveFormsModule,
    
  ],
  exports: [JobDescriptionDetailComponent, JobDescriptionInlineComponent, JobDescriptionDeleteComponent, JobDescriptionDetailsDialogComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class JobDescriptionModule { }
