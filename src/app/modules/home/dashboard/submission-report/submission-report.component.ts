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
  selector: 'app-submission-report',
  templateUrl: './submission-report.component.html',
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
export class SubmissionReportComponent extends BaseReportComponent<JobSummaryGraphUnit> implements OnInit {

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
  tag = ReportTags.JOB_SUMMARY;
  // public rowSelection;
  public job_id;
  public tabularDataForFilter: Array<any>;

  dataType = "Summary";
  summarData: any;
  allData: any;
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
        this.title = params.job_title;
        this.startDate = params.startDate;
        this.endDate = params.endDate;
        this.dateRange = params.dateRange;
        this.bdmId = params.bdm;
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
    this.getSubmissionData();

    // this.tabularData.forEach(item=>{
    //   if(item.job_date)
    //   item.job_date=  moment(item.job_date).format('MM/DD/YYYY');
    // })
  }
  getSubmissionData(): any {
    var apiParam = `date_range=${this.dateRange}`;
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }



    if (this.bdmId) {
      apiParam += `&bdm_id=${this.bdmId}`;
    }

    apiParam += `&job_id=${this.job_id}&country=${this.clientCountry}`;


    console.log("apiParam");
    console.log(apiParam);

    forkJoin([
      this._api.getReportWithApiLink(`/reports/get_jobs_summary_by_datewise_breakdown/?${apiParam}`),
      this._api.getReportWithApiLink(`/reports/job_summary_table_by_title_alldata/?${apiParam}`),
    ])
      .subscribe((res: Array<any>) => {
        this.summarData = res[0];
        this.allData = res[1];

        this.dataSelection();
      }, error => {
        console.log(error);
      })


  }

  downloadCsvFile(): void {
    var apiParam = `date_range=${this.dateRange}`;
    var fileName = 'job_submission_summary'
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }

    if (this.bdmId) {
      apiParam += `&bdm_id=${this.bdmId}`;
    }

    apiParam += `&job_id=${this.job_id}&country=${this.clientCountry}`;
    var csv_api;
    if (this.dataType === "Summary") {
      apiParam += `&data_type=summary`;
      csv_api = `/reports/get_jobs_summary_by_datewise_breakdown_csv/?${apiParam}`;
    } else {
      apiParam += `&data_type=all_data`;
      fileName = 'job_submission_all_data'
      csv_api = `/reports/job_summary_table_by_title_alldata_csv/?${apiParam}`;
    }

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

  dataSelection() {
    var data;
    if (this.dataType === "Summary") {
      data = this.summarData;
    } else {
      data = this.allData;
    }

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
      if (_.remarks) {
        const txt = document.createElement('textarea');
        txt.innerHTML = _.remarks.replace(/<[^>]+>/g, '');
        _.remarks = txt.value.replace(/\s+/g, ' ').trim();
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

  // filterRecruiter(event: string): void {
  //   this.bdmName = event;
  //   const jobSummary = new Set<Label>();
  //   // console.log(this.data)
  //   this.chartLabels = [];
  //   this.isCompleted = false;
  //   if (event === 'ALL') {
  //     this.chartLabels = Array.from(this.getAllXAxisLabel());
  //     this.tabularData;

  //   } else {
  //     this.data.forEach(_ => {
  //       if (_.bdm_name === event && _.total_count > 0) {
  //         jobSummary.add(_.job_title);
  //       }
  //     });
  //     this.chartLabels = Array.from(jobSummary) as Array<string>;
  //     // this.chartLabels = [event];

  //   }
  //   // console.log(this.chartLabels)
  //   this.resetChartData();
  //   this.filterData(this.data);
  // }


  onSelectionChanged(data) {
    if (this.dataType !== "Summary") {
      return;
    }
    var selectedRows = this.gridApi.getSelectedRows();
    console.log(selectedRows);
    console.log(data);
    const queryParams = { job_id: this.job_id, job_title: this.title, rid: data.data.rid, bdm: this.bdmId, startDate: this.startDate, endDate: this.endDate, dateRange: this.dateRange, country: this.clientCountry, rname: data.data.recruiter_name };

    const link = this.router.serializeUrl(this.router.createUrlTree(['/home/reports/submission-candidate-report'], { queryParams: queryParams, }));
    window.open(link, '_blank');
    // this.router.navigate(['/home/reports/submission-candidate-report'], { state: { startDate: this.startDate, endDate: this.endDate, dateRange: this.dateRange, selectedRow: this.selectedRow } });

    // this.viewAllSubmissions();
    // document.querySelector('#selectedRows').innerHTML =
    //   selectedRows.length === 1 ? selectedRows[0].athlete : '';
  }
  // filterOnTable(bdmName: string, country: string) {
  //   this.bdmName = bdmName;
  //   this.clientCountry = country;
  //   this.tabularDataForFilter = this.tabularData;
  //   if (bdmName === 'ALL' && country === 'none') {
  //     this.tabularDataForFilter = this.tabularData;
  //   }

  //   else if (bdmName === 'ALL' && country !== 'none') {
  //     this.tabularDataForFilter = this.tabularData.filter(_ => {
  //       if (country === _.client_country) {
  //         // console.log(_)
  //         return _;
  //       }
  //     })
  //   }
  //   else if (bdmName !== 'ALL' && country === 'ALL') {
  //     this.tabularDataForFilter = this.tabularData.filter(_ => {
  //       if (bdmName === _.bdm_name) {
  //         // console.log(_)
  //         return _;
  //       }
  //     })
  //   }
  //   else {
  //     this.tabularDataForFilter = this.tabularData.filter(_ => {
  //       if (bdmName === _.bdm_name && country === _.client_country) {
  //         // console.log(_)
  //         return _;
  //       }
  //     })
  //   }
  // }

  clientNameClick(params) {
    console.log("params");
  }

  selectDataType(dataType) {
    this.dataType = dataType;
    console.log(this.dataType)
    this.dataSelection();
  }



  columnDefsSum = [
    // {
    //   headerName: "Date", field: "job_posted_date", sortable: true, filter: true,


    // },

    { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true },
    { headerName: "Submission", field: "Submission", sortable: true, filter: true },
    { headerName: "Submission Rejected", field: "SubmissionReject", sortable: true, filter: true },
    { headerName: "Internal Submission", field: "InternalSubmission", sortable: true, filter: true },
    { headerName: "Internal Submission Rejected", field: "InternalSubmissionReject", sortable: true, filter: true },
    { headerName: "Tech screening interview", field: "InternalInterview", sortable: true, filter: true },
    { headerName: "Tech screening interview Reject", field: "InternalInterviewReject", sortable: true, filter: true },
    { headerName: "Internal Shortlisted", field: "InternalShortlisted", sortable: true, filter: true },
    { headerName: "Internal Offered", field: "InternalOffered", sortable: true, filter: true },
    { headerName: "Internal Offered Rejected", field: "InternalOfferedReject", sortable: true, filter: true },
    { headerName: "Internal Placed", field: "InternalPlaced", sortable: true, filter: true },
    { headerName: "SendOut to Client", field: "SendOuttoClient", sortable: true, filter: true },
    { headerName: "Candidate Review", field: "CandidateReview", sortable: true, filter: true },
    { headerName: "Holdby BDM", field: "HoldbyBDM", sortable: true, filter: true },
    { headerName: "SendOut", field: "SendOut", sortable: true, filter: true },
    { headerName: "SendOut Rejected", field: "SendoutReject", sortable: true, filter: true },
    // { headerName: "Candidate Added", field: "CandidateAdded", sortable: true, filter: true },
    { headerName: "Client Interview", field: "ClientInterview", sortable: true, filter: true },
    { headerName: "Holdby Client", field: "HoldbyClient", sortable: true, filter: true },
    { headerName: "Interview Backout", field: "InterviewBackout", sortable: true, filter: true },
    // { headerName: "Interview Reject", field: "InterviewReject", sortable: true, filter: true },
    { headerName: "Interview Rejected", field: "RejectedByClient", sortable: true, filter: true },
    { headerName: "Feedback Awaited", field: "FeedbackAwaited", sortable: true, filter: true },
    { headerName: "Shortlisted", field: "Shortlisted", sortable: true, filter: true },
    { headerName: "Offered", field: "Offered", sortable: true, filter: true },
    { headerName: "Offer Rejected", field: "OfferRejected", sortable: true, filter: true },
    { headerName: "Offer Backout", field: "OfferBackout", sortable: true, filter: true },
    { headerName: "Placed", field: "Placed", sortable: true, filter: true },
    // { headerName: "Client Interview Second", field: "ClientInterviewSecond", sortable: true, filter: true },
    // { headerName: "Second Interview Reject", field: "SecondInterviewReject", sortable: true, filter: true },
    // { headerName: "Rejected By Team", field: "RejectedByTeam", sortable: true, filter: true },
    // { headerName: "Client Interview First", field: "ClientInterviewFirst", sortable: true, filter: true },
    // { headerName: "Interview Select", field: "InterviewSelect", sortable: true, filter: true },


    // { headerName: "Internal Interview", field: "InternalInterview1", sortable: true, filter: true },
    // { headerName: "Internal Interview Rejected", field: "InternalInterviewReject1", sortable: true, filter: true },


    { headerName: "BDM Name", field: "bdm_name", sortable: true, filter: true },
    { headerName: "Employment Type", field: "job_type", sortable: true, filter: true },
    { headerName: "Min Salary($)", field: "min_salary", sortable: true, filter: true },
    { headerName: "Max Salary($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Min Rate($)", field: "min_rate", sortable: true, filter: true },
    { headerName: "Max Rate($)", field: "max_rate", sortable: true, filter: true },



  ];



  columnDefsAllData = [
    {
      headerName: "Submission Date", field: "submission_date", sortable: true, filter: true, flex: 1.5,
    },
    { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true, flex: 1.5, },
    { headerName: "Candidate Name", field: "candidate_name", sortable: true, filter: true, flex: 2, },
    { headerName: "Current Status", field: "current_status", sortable: true, filter: true, flex: 1.5, },
    { headerName: "Remarks", field: "remarks", sortable: true, filter: true, flex: 4 },

  ];


  viewAllSubmissions() {

    var apiParam = `date_range=${this.dateRange}`;
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }

    // this._api.getReportWithApiLink(`/reports/job_summary_table_by_title/?${apiParam}`).subscribe(_ => {
    //   const modalRef = this.modalService.open(SubmissionReportComponent, {
    //     backdrop: 'static',
    //     centered: true,
    //     keyboard: false,
    //     size: 'lg'

    //   });
    //   // _.forEach(_ => {
    //   //   Object.keys(_).forEach(key => {
    //   //     // && key!=="Candidate Added"
    //   //     if (_[key] === null)
    //   //       _[key] = "--";
    //   //   });
    //   // });

    //   // _.forEach(item => {

    //   //   if (item.first_name) {
    //   //     item.full_name = item.first_name + " " + item.last_name;
    //   //   }
    //   //   if (item.submission_date) {
    //   //     item.submission_date = item.submission_date.split(" ")[0];
    //   //   }
    //   //   if (item.updated_at) {
    //   //     item.updated_at = item.updated_at.split(" ")[0];
    //   //   }
    //   // });

    //   modalRef.componentInstance.candidates = _;
    //   modalRef.componentInstance.tag = 'job_wise_candidates';
    //   // modalRef.componentInstance.id = idx;
    //   modalRef.componentInstance.isPopup = true;
    //   modalRef.result.then(res => {

    //   }, error => {
    //     console.log(error);

    //   });
    // })
  }

}
