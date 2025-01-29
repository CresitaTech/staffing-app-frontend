import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { APIPath } from 'src/app/enums/api-path.enum';
import { ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-candidate-details',
  template: `
  <div class="modal-header">
  <h5 class="modal-title" *ngIf="tag==='bdm' || tag==='recruiter'" >Candidate Details</h5>
  <h5 class="modal-title" *ngIf="tag==='dashboard_recruiter'">My Candidates</h5>
  <h5 class="modal-title" *ngIf="tag==='job_wise_candidates'">Candidate Details</h5>

  <h5 class="modal-title" *ngIf="tag==='job_summary'">Job Summary</h5>
  <h5 class="modal-title" *ngIf="tag==='bdm_job'">Jobs by BDM</h5>
  <div class="col-auto pr-0">
  <a *ngIf="tag!=='dashboard_recruiter'" class="chart-icon btn-link" (click)="downloadFile(tag)" data-tooltip="tooltip"
  data-placement="bottom" title="Download CSV" >
  <i class="fas fa-file-excel excel-modal"></i>
  </a>
  <button type="button"  class="close2" aria-label="Close" (click)="activeModal.dismiss()">
    <span aria-hidden="true">&times;</span>
  </button>
  </div>
  </div>
  <div class="col graph">
  <div class="table-responsive">

  <div class="example-header mb-2">
  Page Size:
  <select (change)="onPageSizeChanged()" id="page-size">
    <option value="10" selected="">10</option>
    <option value="20">20</option>
    <option value="50">50</option>
    <option value="100">100</option>
    <option value="500">500</option>
    <option value="1000">1000</option>
  </select>
</div>

<ag-grid-angular *ngIf="tag!=='bdm_job' && tag!=='dashboard_recruiter' && tag!=='job_wise_candidates'"
style="width: 100%; height: 400px;"
class="ag-theme-alpine"
[rowData]="candidates"
[columnDefs]="columnDefs"
pagination=true
paginationPageSize="10"
(gridReady)="onGridReady($event)"
>
</ag-grid-angular>

<ag-grid-angular *ngIf="tag==='bdm_job'"
style="width: 100%; height: 400px;"
class="ag-theme-alpine"
[rowData]="candidates"
[columnDefs]="columnDefsForBDMJobs"
pagination=true
paginationPageSize="10"
(gridReady)="onGridReady($event)"
>
</ag-grid-angular>

<ag-grid-angular *ngIf="tag==='dashboard_recruiter'"
style="width: 100%; height: 400px;"
class="ag-theme-alpine"
[rowData]="candidates"
[columnDefs]="columnDefsInDashBoardForRecruiter"
pagination=true
paginationPageSize="10"
(gridReady)="onGridReady($event)"
>
</ag-grid-angular>

<ag-grid-angular *ngIf="tag==='job_wise_candidates'"
style="width: 100%; height: 400px;"
class="ag-theme-alpine"
[rowData]="candidates"
[columnDefs]="columnDefsForJobWiseCandidates"
pagination=true
paginationPageSize="10"
(gridReady)="onGridReady($event)"
>
</ag-grid-angular>

</div>
</div>
`,
  styles: [
    ` .example-header {
      font-family: Verdana, Geneva, Tahoma, sans-serif;
      font-size: 13px;
      margin-bottom: 5px;
    }
    `
  ]
})
export class CandidateDetailsComponent implements OnInit {

  @Input() candidates;
  @Input() tag;
  @Input() id;
  @Input() label;
  @Input() start_date;
  @Input() end_date;
  @Input() dateRange;
  @Input() datelabel;
  @Input() dateForMoreThan30days;
  public gridApi;


  constructor(
    public activeModal: NgbActiveModal,
    private _api: APIProviderService<any>
  ) { }

  ngOnInit(): void {
    console.log(this.candidates);
  }


  columnDefs = [
    { headerName: "Candidate Name", field: "candidate_full_name", sortable: true, filter: true },
    { headerName: "Email", field: "candidate_name.primary_email", sortable: true, filter: true },
    { headerName: "Phone Number", field: "candidate_name.primary_phone_number", sortable: true, filter: true },
    { headerName: "Job Title", field: "job_description.job_title", sortable: true, filter: true },
    { headerName: "Min Salary($)", field: "candidate_name.min_salary", sortable: true, filter: true },
    { headerName: "Max Salary($)", field: "candidate_name.max_salary", sortable: true, filter: true },
    { headerName: "Min Rate($)", field: "candidate_name.min_rate", sortable: true, filter: true },
    { headerName: "Max Rate($)", field: "candidate_name.max_rate", sortable: true, filter: true },
    { headerName: "Status", field: "stage.stage_name", sortable: true, filter: true },
    { headerName: "Skill 1", field: "candidate_name.skills_1", sortable: true, filter: true },
    { headerName: "Skill 2", field: "candidate_name.skills_2", sortable: true, filter: true },
    { headerName: "Created Date", field: "candidate_name.created_at", sortable: true, filter: true },
  ];


  columnDefsForBDMJobs = [
    { headerName: "Job Posted Date", field: "created_at", sortable: true, filter: true },
    { headerName: "Client", field: "client_name.company_name", sortable: true, filter: true },
    { headerName: "Job Title", field: "job_title", sortable: true, filter: true },
    { headerName: "Min Salary($)", field: "min_salary", sortable: true, filter: true },
    { headerName: "Max Salary($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Min Rate($)", field: "min_rate", sortable: true, filter: true },
    { headerName: "Max Rate($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Job ID", field: "job_id", sortable: true, filter: true },
  ]


  columnDefsInDashBoardForRecruiter = [
    { headerName: "Submission Date", field: "submission_date", sortable: true, filter: true },
    { headerName: "Candidate Name", field: "candidate_name", sortable: true, filter: true },
    { headerName: "Job Title", field: "job_title", sortable: true, filter: true },
    { headerName: "Client Name", field: "client_name", sortable: true, filter: true },
    { headerName: "Client Country", field: "country", sortable: true, filter: true },
    { headerName: "Current Status", field: "current_status", sortable: true, filter: true },
    { headerName: "BDM Name", field: "bdm_name", sortable: true, filter: true },
    { headerName: "Last Updated", field: "last_updated", sortable: true, filter: true },
  ]


  columnDefsForJobWiseCandidates = [
    { headerName: "Candidate Name", field: "full_name", sortable: true, filter: true },
    { headerName: "Status", field: "status", sortable: true, filter: true },
    { headerName: "Submission Date", field: "submission_date", sortable: true, filter: true },
    { headerName: "Last Updated On", field: "updated_at", sortable: true, filter: true },
    { headerName: "Created By", field: "created_by_name", sortable: true, filter: true },
    { headerName: "Updated By", field: "updated_by_name", sortable: true, filter: true },
    { headerName: "Max Rate($)", field: "max_rate", sortable: true, filter: true },
    { headerName: "Min Rate($)", field: "min_rate", sortable: true, filter: true },
    { headerName: "Max Salary($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Min Salary($)", field: "min_salary", sortable: true, filter: true },
    { headerName: "Visa", field: "visa", sortable: true, filter: true },
  ]


  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }

  onGridReady(params) {
    this.gridApi = params.api;
  }

  getDays(startDate: string, endDate: string) {
    var sDate = new Date(startDate);
    var eDate = new Date(endDate);
    var diffTime = eDate.getTime() - sDate.getTime();
    return diffTime / (1000 * 3600 * 24);
  }


  downloadFile(tag: string): void {
    console.log(tag);

    let dateParams = '';
    let otherParams = '';
    var APIString;
    var diffdays;
    if (this.dateRange !== ReportDateRange.CUSTOM) {
      dateParams = `&date_range=${this.dateRange}`;
    } else {
      dateParams = `&start_date=${this.start_date}&end_date=${this.end_date}`;
    }

    if (this.tag === ReportTags.RECRUITER) {
      otherParams = `?recruiter_id=${this.id}&stage=${this.label}${dateParams}`;
    }
    if (this.tag === ReportTags.CANDIDATE_REPORT) {
      otherParams = `?recruiter_id=${this.id}&stage=${this.label}${dateParams}`;
    }
    if (this.tag === ReportTags.BDM) {
      otherParams = `?bdm_id=${this.id}&stage=${this.label}${dateParams}`;
    }
    if (this.tag === ReportTags.JOB_SUMMARY) {
      otherParams = `?job_id=${this.id}&stage=${this.label}${dateParams}`;

    }
    if (this.tag === ReportTags.BDM_JOBS) {
      if (this.dateRange !== ReportDateRange.CUSTOM)
        otherParams = `?job_creater_id=${this.id}&single_date=${this.datelabel}`;
      else {
        diffdays = this.getDays(this.start_date, this.end_date);
        if (diffdays <= 30) {
          otherParams = `?job_creater_id=${this.id}&single_date=${this.datelabel}`;
        }
        else if (diffdays > 30) {
          var year = this.dateForMoreThan30days.split("-")[0];
          var month = this.dateForMoreThan30days.split("-")[1];
          otherParams = `?job_creater_id=${this.id}&month=${month}&year=${year}`;
        }
      }
    }
    console.log(otherParams);
    if (tag === 'job_wise_candidates') {
      APIString = `${APIPath.DOWNLOAD_JOB_CANDIDATE_DETAILS}?job_id=${this.id}`
    }
    else {
      APIString = `${APIPath.DOWNLOAD_SPECIFIC_CANDIDATE_DETAILS}${otherParams}`;
    }

    this._api
      .getReportWithApiLink(APIString, 'text')
      .subscribe(res => {
        var downloadLink = document.createElement("a");
        var blob = new Blob(["\ufeff", res]);
        var url = URL.createObjectURL(blob);
        downloadLink.href = url;
        if (this.tag === 'job_wise_candidates') {
          downloadLink.download = this.tag + ".csv";
        }
        else if (this.tag === ReportTags.RECRUITER || this.tag === ReportTags.BDM ||
          this.tag === ReportTags.JOB_AGE || this.tag === ReportTags.JOB_SUMMARY || this.tag === ReportTags.CANDIDATE_REPORT)
          downloadLink.download = this.tag + "_" + this.datelabel + ".csv";
        else if (this.tag == ReportTags.BDM_JOBS) {
          if (diffdays > 30)
            downloadLink.download = this.tag + "s" + "_" + this.label + "_" + this.datelabel.split(" ")[0] + ".csv";
          else
            downloadLink.download = this.tag + "s" + "_" + this.label + "_" + this.datelabel + ".csv";
        }
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
  }

}
