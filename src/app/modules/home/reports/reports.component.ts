import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export enum ReportEnum {
  RECRUITER = "recruiter-submission",
  RECRUITER_PERFORMANCE = "recruiter-performance",
  CANDIDATE_REPORT = "candidate-report",
  BDM = "bdm-performance",
  JOB = "job-summary",
  BDM_JOBS = "bdm-jobs",
  JOB_AGE = "job-aging",
  SUBMISSSION_SUMMARY = "submission-report",
  CLIENT_SUBMISSSION_SUMMARY = "client-submission-report",
  RECRUITER_PERFORMANCE_DETAIL = "recruiter-performance-detail",
  SUBMISSSION_CANDIDATE_SUMMARY = "submission-candidate-report",
  STATUS_REPORT = "status-report",
  CLIENT_REVENUE = "client-revenue",
  JOBS_BY_CLIENT = "jobs-by-client",
  COMMON_SUBMISSION_REPORT = "common-submission-report"
}

@Component({
  selector: 'app-reports',
  template: `
    <div class="container-fluid">
      <div class="row mt-3 mb-3 page-header">
        <div class="col-auto">
            <h4 class="page-title mb-0">{{title}}</h4>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item"><a >Reports</a></li>
                    <li class="breadcrumb-item active" aria-current="page">{{title}}</li>
                </ol>
            </nav>
        </div>
      </div>
      <ng-container *ngIf="enumValue === enum.RECRUITER">
        <app-recruiter-submission [title]="'Recruiters Submission'" [show_download]="true" [show_tabular]="true">
        </app-recruiter-submission>
      </ng-container>

      <ng-container *ngIf="enumValue === enum.RECRUITER_PERFORMANCE">
      <app-recruiter-performance [title]="'Recruiters Performance'" [show_download]="true" [show_tabular]="true">
      </app-recruiter-performance>
    </ng-container>
      <ng-container *ngIf="enumValue === enum.CANDIDATE_REPORT">
      <app-candidate-report [title]="'Candidate Report'" [show_download]="true" [show_tabular]="true">
      </app-candidate-report>
    </ng-container>
      <ng-container *ngIf="enumValue === enum.BDM">
        <app-bdm-performance [title]="'Business Development Managers Performance'" [show_download]="true" [show_tabular]="true">
        </app-bdm-performance>
      </ng-container>
      <ng-container *ngIf="enumValue === enum.JOB">
        <app-job-summary [title]="'Job Summary'" [show_download]="true" [show_tabular]="true">
        </app-job-summary>
      </ng-container>

      <ng-container *ngIf="enumValue === enum.STATUS_REPORT">
      <app-status-report [title]="'Status Report'" [show_download]="true" [show_tabular]="true">
      </app-status-report>
    </ng-container>

      <ng-container *ngIf="enumValue === enum.SUBMISSSION_SUMMARY">
      <app-submission-report [title]="'Submission Summary'" [show_download]="true" [show_tabular]="true">
      </app-submission-report>
    </ng-container>
    <ng-container *ngIf="enumValue === enum.COMMON_SUBMISSION_REPORT">
      <app-common-submission-report [title]="'Common submission report'" [show_download]="true" [show_tabular]="true">
      </app-common-submission-report>
    </ng-container>

    <ng-container *ngIf="enumValue === enum.CLIENT_SUBMISSSION_SUMMARY">
    <app-client-submission-report [title]="'Client Submission Summary'" [show_download]="true" [show_tabular]="true">
    </app-client-submission-report>
  </ng-container>

    <ng-container *ngIf="enumValue === enum.RECRUITER_PERFORMANCE_DETAIL">
      <app-recruiter-performance-detail [title]="'Recruiters Performance'" [show_download]="true" [show_tabular]="true">
      </app-recruiter-performance-detail>
    </ng-container>

    <ng-container *ngIf="enumValue === enum.SUBMISSSION_CANDIDATE_SUMMARY">
    <app-submission-candidate-report [title]="'Submission Summary'" [show_download]="true" [show_tabular]="true">
    </app-submission-candidate-report>
  </ng-container>




    <ng-container *ngIf="enumValue === enum.BDM_JOBS">
      <app-bdm-jobs [title]="'BDM Jobs'" [show_download]="true" [show_tabular]="true">
      </app-bdm-jobs>
    </ng-container>
    <ng-container *ngIf="enumValue === enum.JOB_AGE">
      <app-job-aging [title]="'Active Job Aging'" [show_download]="true" [show_tabular]="true">
      </app-job-aging>
    </ng-container>
    <ng-container *ngIf="enumValue === enum.CLIENT_REVENUE">
    <app-client-revenue [title]="'Client Revenue'" [show_download]="true" [show_tabular]="true">
    </app-client-revenue>
  </ng-container>
  <ng-container *ngIf="enumValue === enum.JOBS_BY_CLIENT">
    <app-jobs-by-client [title]="'Jobs by Client'" [show_download]="true" [show_tabular]="true">
    </app-jobs-by-client>
  </ng-container>
    </div>
  `,
  styles: [
  ]
})
export class ReportsComponent implements OnInit {

  title = 'Report';
  enum = ReportEnum;
  enumValue: ReportEnum;

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.enumValue = params.title;
      if (params.title === ReportEnum.RECRUITER_PERFORMANCE || params.title === ReportEnum.RECRUITER_PERFORMANCE_DETAIL) {
        this.title = "Recruiter Performance"
      } else if (params.title === ReportEnum.BDM) {
        this.title = "BDM Performance"
      }else if (params.title === ReportEnum.RECRUITER) {
        this.title = "Recruiter Submission"
      } else if (params.title === ReportEnum.CANDIDATE_REPORT) {
        this.title = "Candidate Report"
      } else if (params.title === ReportEnum.JOB) {
        this.title = "Job Summary"
      } else if (params.title === ReportEnum.BDM_JOBS) {
        this.title = "BDM Jobs"
      } else if (params.title === ReportEnum.SUBMISSSION_SUMMARY) {
        this.title = "Submission Summary"
      }
      else if (params.title === ReportEnum.STATUS_REPORT) {
        this.title = "Status Report"
      }
      else if (params.title === ReportEnum.CLIENT_SUBMISSSION_SUMMARY) {
        this.title = "Client Submission Summary"
      } else if (params.title === ReportEnum.JOB_AGE) {
        this.title = "Active Job Aging"
      } else if (params.title === ReportEnum.CLIENT_REVENUE) {
        this.title = "Client Revenue"
      }
      else if (params.title === ReportEnum.JOBS_BY_CLIENT) {
        this.title = "Jobs by Client"
      }

    })
  }

  ngOnInit(): void {
  }

}
