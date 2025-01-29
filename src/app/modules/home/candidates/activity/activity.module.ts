import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddActivityComponent } from './add-activity/add-activity.component';
import { AddActivityInternalComponent } from './add-activity-internal/add-activity-internal.component';

// import { ActivityFilterComponent } from './activity-filter/activity-filter.component';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { FormsModule } from '@angular/forms';
import { ActivityComponent } from './activity.component';
import { SharedModule } from 'src/app/components/shared-components.module';
import { ActivityRoutingModule } from './activity-routing.module';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CandidateModule } from '../candidate/candidate.module';
import { JobDescriptionModule } from '../../job-descriptions/job-description/job-description.module';


@NgModule({
  declarations: [AddActivityComponent, ActivityComponent, AddActivityInternalComponent
    // ActivityFilterComponent, 
  ],
  imports: [
    CommonModule,
    ActivityRoutingModule,
    CandidateModule,
    FormsModule,
    SharedModule,
    NgSelectModule,
    PipeModule,
    Ng2SearchPipeModule,
    NgbModule,
    JobDescriptionModule
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class ActivityModule { }
