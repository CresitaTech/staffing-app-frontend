import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { Label } from 'ng2-charts';
import { JobSummaryGraphUnit, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { BaseReportComponent } from '../base-report/base-report.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-status-report',
  templateUrl: './status-report.component.html',
  styles: [
    `
    .example-header {
      font-family: Verdana, Geneva, Tahoma, sans-serif;
      font-size: 13px;
      margin-bottom: 5px;
    }
      .graph {
        min-height: 350px;
      }
      .chart-icon {
        font-size: 1.2rem;
      }
      .form-check-inline .form-check-input {
        margin-top: 0px;
    }

    `
  ],
  providers: [OrderByDatePipe]
})
export class StatusReportComponent extends BaseReportComponent<JobSummaryGraphUnit> implements OnInit {

  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;
  public gridApi;
  public dateRange = ReportDateRange.MONTH;
  // selectedRow: any;
  // title: string = "";
  public startDate: string = moment(new Date()).format('YYYY-MM-DD');
  ;
  public endDate: string = moment(new Date()).format('YYYY-MM-DD');;
  graph_api = '/reports/job_summary_graph/';
  table_api = '/reports/job_summary_table/';
  csv_api = '/reports/job_summary_csv/';
  label_name = 'job_title';
  job_title;
  status
  tag = ReportTags.JOB_SUMMARY;
  // public rowSelection;
  public job_id;
  public tabularDataForFilter: Array<any>;

  // dataType = "Summary";
  summarData: any;
  // allData: any;
  bdmId;
  frameworkComponents: any;
  constructor(
    _api: APIProviderService<JobSummaryGraphUnit>,
    modal: NgbModal,
    public modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super(_api, modal);
    // this.endDate = this.router.getCurrentNavigation().extras.state.endDate;
    // this.startDate = this.router.getCurrentNavigation().extras.state.startDate;
    // this.dateRange = this.router.getCurrentNavigation().extras.state.dateRange;
    // this.selectedRow = this.router.getCurrentNavigation().extras.state.selectedRow;

  }
  public rowData: any;
  private gridColumnApi;
  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        console.log(params); // { orderby: "price" }
        this.job_id = params.job_id;
        this.title = params.title;
        this.startDate = params.startDate;
        this.endDate = params.endDate;
        this.dateRange = params.dateRange;
        this.bdmId = params.bdm;
        this.job_title = params.job_title;
        this.status = params.status;
        this.clientCountry = params.country;
        console.log(this.job_id); // price
      }
      );
    // console.log("this.endDate");
    // this.endDate = history.state.endDate;
    // // this.selectedRow = history.state.selectedRow;
    // this.title = this.selectedRow.job_title;
    // console.log(this.endDate);
    // console.log(this.startDate);
    // console.log(this.dateRange);
    // console.log(this.selectedRow);
    this.getStatusSubmissionData();

    // this.tabularData.forEach(item=>{
    //   if(item.job_date)
    //   item.job_date=  moment(item.job_date).format('MM/DD/YYYY');
    // })
  }
  getStatusSubmissionData(): any {
    var apiParam = `date_range=${this.dateRange}`;
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }



    if (this.bdmId) {
      apiParam += `&bdm_id=${this.bdmId}`;
    }

    apiParam += `&job_id=${this.job_id}&country=${this.clientCountry}&status=${this.status}`;


    console.log("apiParam");
    console.log(apiParam);

    forkJoin([
      this._api.getReportWithApiLink(`/reports/job_summary_by_status/?${apiParam}`),
    ])
      .subscribe((res: Array<any>) => {
        this.summarData = res[0];
     

        this.dataStatusSelection();
      }, error => {
        console.log(error);
      })


  }

  downloadStatusCsvFile(): void {
    var apiParam = `date_range=${this.dateRange}`;
    var fileName = 'job_submission_summary'
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }

    if (this.bdmId) {
      apiParam += `&bdm_id=${this.bdmId}`;
    }

    apiParam += `&job_id=${this.job_id}&country=${this.clientCountry}&status=${this.status}`;
    var csv_api;
   
    
      fileName = this.title+'_status_report'
      csv_api = `/reports/job_summary_by_status_csv/?${apiParam}`;
   

    this._api
      .getReportWithApiLink(`${csv_api}`, 'text')
      .subscribe(res => {
        var downloadLink = document.createElement("a");
        var blob = new Blob(["\ufeff", res]);
        var url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = fileName + ".csv";

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
  }

  dataStatusSelection() {
    var data;
  
      data = this.summarData;
  

    this.tabularData = data;
    this.tabularData.forEach(_ => {


      Object.keys(_).forEach(key => {
        // && key!=="Candidate Added"
        if (_[key] === null)
          _[key] = "--";
      });

      // countries.add(_.country);
      if (_.job_date) {
        _.job_date = _.job_date.split(" ")[0];
      }
      if (_.submission_date) {
        _.submission_date = _.submission_date.split(" ")[0];
      }
      if (_.created_at) {
        _.created_at = _.created_at.split("T")[0];
      }
      if (_.posted_date) {
        _.posted_date = _.posted_date.split(" ")[0];
      }
      if (_.first_submission_date) {
        _.first_submission_date = _.first_submission_date.split(" ")[0];
      }
      if (_.first_assingment_date) {
        _.first_assingment_date = _.first_assingment_date.split(" ")[0];
      }
      if (this.tag === ReportTags.JOB_SUMMARY) {
        this.setForJobSummary.add(_.bdm_name);
        if (_.client_country !== "--") {
          this.setForJobSummaryCountry.add(_.client_country);
        }
        // this.xAxisCountryFilterArray.push(_.client_country);
      }
      if (this.tag === ReportTags.BDM_JOBS) {
        this.setForBDMJobs.add(_.created_by.first_name);
        _.full_name = _.created_by.first_name + " " + _.created_by.last_name;
      }
      if (this.tag === ReportTags.JOB_AGE) {
        this.setForJobAging.add(_.bdm_name);
      }
      if (this.tag === ReportTags.CLIENT_REVENUE) {
        this.setForClientName.add(_.client_name_value);
      }
      if (this.tag === ReportTags.JOBS_BY_CLIENT) {
        this.setForJobsByClient.add(_.client_name);
      }

      // if(_.created_by){
      //   _.full_name=_.created_by.first_name+" "+_.created_by.last_name;
      // }
    })



    this.tabularDataForFilter = this.tabularData;
    this.xAxisCountryFilterArray = Array.from(this.setForJobSummaryCountry) as Array<string>;

    // if (this.tag === "job_summary") {
    //   this.filterOnTableBdm(this.bdmName, this.clientCountry);
    // }
    // this.xAxisFilter = 'ALL'
    // this.bdmName = 'ALL'
    // this.clientName = 'ALL'
    console.log(this.xAxisCountryFilterArray);
  }


  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }






  columnDefsAllData = [
    {
      headerName: "Submission Date", field: "submission_date", sortable: true, filter: true, flex: 2,
    },
    { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true, flex: 2, },
    { headerName: "Candidate Name", field: "candidate_name", sortable: true, filter: true, flex: 2, },
    { headerName: "Email", field: "primary_email", sortable: true, filter: true },
    { headerName: "Phone Number", field: "primary_phone_number", sortable: true, filter: true },
    // { headerName: "Min Salary($)", field: "min_salary", sortable: true, filter: true },
    // { headerName: "Max Salary($)", field: "max_salary", sortable: true, filter: true },
    // { headerName: "Min Rate($)", field: "min_rate", sortable: true, filter: true },
    // { headerName: "Max Rate($)", field: "max_rate", sortable: true, filter: true },
    
    { headerName: "Total Experience", field: "total_experience", sortable: true, filter: true },
    { headerName: "Visa", field: "visa", sortable: true, filter: true },
    // { headerName: "Rank", field: "rank", sortable: true, filter: true },
    // { headerName: "Location", field: "location", sortable: true, filter: true },
    { headerName: "Country", field: "country", sortable: true, filter: true },
    { headerName: "Remarks", field: "remarks", sortable: true, filter: true },

  ];


 
}
