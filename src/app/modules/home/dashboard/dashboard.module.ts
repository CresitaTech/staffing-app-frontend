import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { ChartsModule } from 'ng2-charts';
import { SharedModule } from 'src/app/components/shared-components.module';
import { ClientsModule } from '../clients/clients.module';
import { JobDescriptionModule } from '../job-descriptions/job-description/job-description.module';
import { RecruiterSubmissionComponent } from './recruiter-submission/recruiter-submission.component';
import { RecruiterPerformanceComponent } from './recruiter-performance/recruiter-performance.component';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { FormsModule } from '@angular/forms';
import { DateRangePickerComponent } from './date-range-picker/date-range-picker.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BdmPerformanceComponent } from './bdm-performance/bdm-performance.component';
import { JobSummaryComponent } from './job-summary/job-summary.component';
import { CandidateModule } from '../candidates/candidate/candidate.module';
import { AgGridModule } from 'ag-grid-angular';
import { UnassignedJobsComponent } from './unassigned-jobs/unassigned-jobs.component';
import { MyJobsComponent } from './my-jobs/my-jobs.component';
import { CandidateDetailsComponent } from './candidate-details/candidate-details.component';
import { BdmJobsComponent } from './bdm-jobs/bdm-jobs.component';
import { JobAgingComponent } from './job-aging/job-aging.component';
import { ClientRevenueComponent } from './client-revenue/client-revenue.component';
import { JobsByClientComponent } from './jobs-by-client/jobs-by-client.component';
import { CandidateReportComponent } from './candidate-report/candidate-report.component';
import { SubmissionReportComponent } from './submission-report/submission-report.component';
import { RecruiterPerformanceDetail } from './recruiter-performance-detail/recruiter-performance-detail.component';
import { SubmissionCandidateReportComponent } from './submission-candidate-report/submission-candidate-report.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ClientSubmissionReportComponent } from './client-submission-report/client-submission-report.component';
import { StatusReportComponent } from './status-report/status-report.component';
import { FilterSearchDropdown } from './filter-search-dropdown/filter-search-dropdown.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonSubmissionReportComponent } from './common-submission-report/common-submission-report.component';


@NgModule({
  declarations: [
    DashboardComponent,
    RecruiterSubmissionComponent,
    CandidateReportComponent,
    RecruiterPerformanceComponent,
    BdmPerformanceComponent,
    DateRangePickerComponent,
    JobSummaryComponent,
    SubmissionReportComponent,
    ClientSubmissionReportComponent,
    StatusReportComponent,
    RecruiterPerformanceDetail,
    SubmissionCandidateReportComponent,
    UnassignedJobsComponent,
    MyJobsComponent,
    CandidateDetailsComponent,
    BdmJobsComponent,
    FilterSearchDropdown,
    JobAgingComponent,
    ClientRevenueComponent,
    JobsByClientComponent,
    CommonSubmissionReportComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    ChartsModule,
    JobDescriptionModule,
    ClientsModule,
    CandidateModule,
    PipeModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    // AgGridModule
    // AgGridModule.withComponents([]),
    AgGridModule.withComponents([]),
    MatTabsModule,
  ],
  exports: [
    RecruiterSubmissionComponent,
    RecruiterPerformanceComponent,
    CandidateReportComponent,
    BdmPerformanceComponent,
    DateRangePickerComponent,
    JobSummaryComponent,
    SubmissionReportComponent,
    ClientSubmissionReportComponent,
    StatusReportComponent,
    RecruiterPerformanceDetail,
    SubmissionCandidateReportComponent,
    BdmJobsComponent,
    FilterSearchDropdown,
    JobAgingComponent,
    JobsByClientComponent,
    ClientRevenueComponent,
    MatTabsModule,
    CommonSubmissionReportComponent
  ],
  bootstrap: [JobSummaryComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardModule { }
