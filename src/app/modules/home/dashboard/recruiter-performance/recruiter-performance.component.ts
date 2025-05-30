import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RecruiterGraphUnit, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { Roles } from 'src/app/enums/role.enum';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BaseReportComponent } from '../base-report/base-report.component';
import { Label } from 'ng2-charts';
import { Observable, forkJoin } from 'rxjs';
import * as moment from 'moment';
import { DateRangePickerComponent } from '../date-range-picker/date-range-picker.component';
import { Router } from '@angular/router';
//declare const $: any;
import { User } from 'src/app/models/user';
import { Constants } from 'src/app/enums/constants.enum';
import { APIPath } from 'src/app/enums/api-path.enum';

@Component({
  selector: 'app-recruiter-performance',
  templateUrl: './recruiter-performance.component.html',
  styleUrls: ['./recruiter-performance.component.scss'],
  styles: [
    `
    p {
      font-family: Lato;
    }

    .example-header {
      font-family: Verdana, Geneva, Tahoma, sans-serif;
      font-size: 13px;
      margin-bottom: 5px;
    }
    `
  ],
  providers: [OrderByDatePipe]
})
export class RecruiterPerformanceComponent extends BaseReportComponent<RecruiterGraphUnit> implements OnInit {

  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;

  graph_api = '/reports/recruiter_calls_performance_summary_graph/';
  tag = ReportTags.RECRUITER_PERFORMANCE;
  table_api = '/reports/recruiter_calls_performance_summary_table/';
  csv_api = '/reports/recruiter_calls_performance_summary_csv/'
  label_name = 'first_name'
  @Input() pageToBeLoaded;
  public gridApi;
  isCandidateAdded: false;
  dataType = "Summary";
  role: Roles;
  roles = Roles;
  summarData: any;
  allData: any;
  api_path = APIPath.USER_ROLE;
  // public dateRangeSelected = ReportDateRange.TODAY;
  // private dateRangeResult: any;
  constructor(
    private router: Router,
    _api: APIProviderService<RecruiterGraphUnit>,
    modal: NgbModal,
    private auth: AuthService
  ) {
    super(_api, modal);
    this.getRole();
  }

  ngOnInit(): void {
    // this.xAxisFilter = null;
    this.xAxisFilterCountry = "ALL";
    this.user_role = "3";
    this.getUserForSelection().subscribe(() => {
      console.log("xAxisFilter: " + this.xAxisFilter);
      console.log("xAxisFilterCountry: " + this.xAxisFilterCountry);

      this.getInitialSubmissionData();
      this.filterOnTableRPS(this.xAxisFilter, this.xAxisFilterCountry);
      this.filterRecruiterRPS(this.xAxisFilter, this.xAxisFilterCountry);
    });

    //   $(document).ready(function() {
    //     $('#example').DataTable();
    // } );


    // if(this.pageToBeLoaded==='dashboard'){
    //   this._api.getReportWithApiLink(`${this.graph_api}?date_range=${this.dateRange}`)
    //   .subscribe((res: Array<any>) => {
    //     this.getStatus(res);
    //     this.xAxisFilter='ALL'
    //   },error=>{
    //     console.log(error);
    //   })
    //   }
    //   else
  }

  getUserForSelection(): Observable<any> {
    return new Observable((observer) => {
      this.auth.getLoggedinUser(sessionStorage.getItem(Constants.USER_ID)).subscribe((user: User) => {
          const fullName = user.first_name + " " + user.last_name;
          const apiPath = `${this.api_path}${this.user_role}`;
          this._api.getReportWithApiLink(apiPath).subscribe((data: any[]) => {
              const bdmNames = data.map(item => item.bdm_name);
              if (bdmNames.includes(fullName)) {
                  this.xAxisFilter = fullName;
              } else {
                  this.xAxisFilter = "ALL";
              }
              observer.next();
              console.log("data: " + fullName);
              observer.complete();
          });
      });
    });
  }

  applyFilters() {
    console.log("Inside apply");
    console.log("xAxisFilter: " + this.xAxisFilter);
    console.log("xAxisFilterCountry: " + this.xAxisFilterCountry);
    console.log("dateRangeSelected: " + this.dateRangeSelected);


    this.filterOnTableRPS(this.xAxisFilter, this.xAxisFilterCountry);
    this.filterRecruiterRPS(this.xAxisFilter, this.xAxisFilterCountry);
    this.dateRangeChangedPR(this.dateRangeSelected);

    if (this.dateRange === ReportDateRange.CUSTOM) {
      this.dateRangeSelectionPR();
    }
  }

  onXAxisFilterChange(event: any): void {
    this.xAxisFilter = event;
  }

  onXAxisFilterCountryChange(event: any): void {
    this.xAxisFilterCountry = event;
  }

  dateRangeChangedPRN(event): void {
    this.dateRangeSelected = event;
  }

  dateRangeSelectionPR(): void {
    if (this.dateRangeResult) {
      this.startDate = this.dateRangeResult.startDate;
      this.endDate = this.dateRangeResult.endDate;
      this.getSubmissionData();
    } else {
      console.log("Date range not selected");
    }
  }

  getInitialSubmissionData(): any {
    var apiParam = `?date_range=${this.dateRangeToday}`;
    var apiParamALL = `?date_range=${this.dateRangeToday}`;

    let id;
    var recruiter

    if (this.allUsers !== undefined && this.allUsers !== null) {
      recruiter = this.findRecruiterIdRP(this.xAxisFilter);
    }
    console.log("recruiter")
    console.log(recruiter)
    if (recruiter !== undefined) {
      id = (recruiter != undefined) ? recruiter.id : this.allUsers
    }

    console.log("recruiter")
    console.log(id)

    if (id !== undefined) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParamALL = `?date_range=${this.dateRangeToday}&recruiter_id=${id}`
        apiParam = `?date_range=${this.dateRangeToday}`
      } else {
        apiParamALL = `?start_date=${this.startDate}&end_date=${this.endDate}&recruiter_id=${id}`
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}`
      }


    } else {
    if (this.dateRange !== ReportDateRange.CUSTOM) {
      apiParamALL = `?date_range=${this.dateRangeToday}`
      apiParam = `?date_range=${this.dateRangeToday}`
    } else {
      apiParamALL = `?start_date=${this.startDate}&end_date=${this.endDate}`
      apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}`
    }
    console.log("recruiter2")
    console.log(apiParam)
    }
    console.log("recruiter")
    console.log(apiParam)


    forkJoin([
      this._api.getReportWithApiLink(`/reports/recruiter_calls_performance_summary_table/${apiParam}`),
      this._api.getReportWithApiLink(`/reports/recruiter_calls_performance_summary_alldata_by_job_id/${apiParamALL}`),
      this._api.getReportWithApiLink(`/reports/recruiter_calls_performance_summary_graph/${apiParam}`),
      // this._api.getReportWithApiLink(`${this.user_api}${this.user_role}`)
    ])
      .subscribe((res: Array<any>) => {
        this.summarData = res[0];
        this.allData = res[1];
        this.getStatus(res[2]);
        // this.allUsers = res[3];
        // this.allUsers.forEach(_ => {
        //   this.setForJobSummary.add(_.bdm_name);
        // })
        this.dataSelection();
      }, error => {
        console.log(error);
      })


  }

  onSelectionChanged(data) {
    // var selectedRows = this.gridApi.getSelectedRows();
    // console.log(selectedRows);
    console.log(data);
    var bdm = this.findRecruiterIdRP(data.data.recruiter_name);
    console.log(bdm)
    // this.dataType = 'All data';
    // this.xAxisFilter = data.data.recruiter_name;
    // this.dataSelection();
    // if(this.xAxisFilterCountry === "none"){
    //   this.xAxisFilterCountry = "ALL";
    // }
    // this.filterOnTableRPS(this.xAxisFilter, this.xAxisFilterCountry);
    // this.filterRecruiterRPS(this.xAxisFilter, this.xAxisFilterCountry);


    // var id = (bdm != undefined) ? bdm.bdm_id : null
    // this.router.navigate(['/home/reports/submission-report'], { state: { startDate: this.startDate, endDate: this.endDate, dateRange: this.dateRange, selectedRow: data.data} });
    // this.viewAllSubmissions();




    /// details

    const queryParams = { startDate: this.startDate, endDate: this.endDate, dateRange: this.dateRange, country: this.clientCountry, rname: data.data.recruiter_name, rid: bdm?.id ?? "none" };

    const link = this.router.serializeUrl(this.router.createUrlTree(['/home/reports/recruiter-performance-detail'], { queryParams: queryParams, }));
    window.open(link, '_blank');

  }

  dateRangeChangedPR(event): void {
    // console.log(this.tag);
    // console.log(this.label_name)

    this.dateRange = event;
    this.startDate = moment(new Date()).format('YYYY-MM-DD');
    this.endDate = moment(new Date()).format('YYYY-MM-DD');
    if (this.dateRange !== ReportDateRange.CUSTOM) {
      let apiParam = '';
      apiParam = `?date_range=${this.dateRangeSelected}`;
      this.getSubmissionData()
    }
  }
  // public openDateRangeModalPR(): void {
  //   this.startDate = moment(new Date()).format('YYYY-MM-DD');
  //   this.endDate = moment(new Date()).format('YYYY-MM-DD')

  //   const modalRef = this.modal.open(DateRangePickerComponent, {
  //     backdrop: 'static', keyboard: false, centered: true,
  //   });
  //   modalRef.componentInstance.startDate = this.startDate;
  //   modalRef.componentInstance.endDate = this.endDate;

  //   modalRef.result.then(result => {
  //     this.startDate = result.startDate
  //     this.endDate = result.endDate
  //     var diffdays = this.getDays(this.startDate, this.endDate);
  //     console.log("no of days" + diffdays);
  //     if (diffdays > 30 && this.tag === ReportTags.BDM_JOBS) {
  //       this.label_name = 'month';
  //     }
  //     this.getSubmissionData();
  //   }, error => {
  //     console.log(error);
  //   })
  // }

  public openDateRangeModalPR(): void {
    this.startDate = moment(new Date()).format('YYYY-MM-DD');
    this.endDate = moment(new Date()).format('YYYY-MM-DD')

    const modalRef = this.modal.open(DateRangePickerComponent, {
      backdrop: 'static', keyboard: false, centered: true,
    });
    modalRef.componentInstance.startDate = this.startDate;
    modalRef.componentInstance.endDate = this.endDate;

    modalRef.result.then(result => {
      this.handleDateRangeResult(result);
    }, error => {
      console.log(error);
    });
  }

  private handleDateRangeResult(result: any): void {
    this.startDate = result.startDate;
    this.endDate = result.endDate;
    this.dateRangeResult = result;
    var diffdays = this.getDays(this.startDate, this.endDate);
    console.log("no of days" + diffdays);
    if (diffdays > 30 && this.tag === ReportTags.BDM_JOBS) {
      this.label_name = 'month';
    }
  }

  // onCandidateaddedSelect(value) {
  //   this.isCandidateAdded = value;
  //   if(this.isCandidateAdded){
  //     this.getData(`?date_range=${this.dateRange}&stage_name=canddate_added`);
  //   }else{
  //     this.getData(`?date_range=${this.dateRange}`);
  //   }
  // }

  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }

  onGridReady(params) {
    this.gridApi = params.api;
  }

  selectDataType(dataType) {
    this.dataType = dataType;
    console.log(this.dataType)
    this.dataSelection();
  }

  findRecruiterIdRP(name) {
    console.log("this.data: " + name)
    console.log("this.data: " + JSON.stringify(this.allUsers))
    let el = this.allUsers.find(el => { return ((el['bdm_name'] === name) ? el['id'] : null) })
    return el
  }



  getSubmissionData(): any {
    var apiParam = `?date_range=${this.dateRange}`;
    var apiParamALL = `?date_range=${this.dateRange}`;
    // if (this.dateRange == ReportDateRange.CUSTOM) {

    //   apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    // }

    let id;
    var recruiter

    if (this.allUsers !== undefined && this.allUsers !== null) {
      recruiter = this.findRecruiterIdRP(this.xAxisFilter);
    }
    console.log("recruiter")
    console.log(recruiter)
    if (recruiter !== undefined) {
      id = (recruiter != undefined) ? recruiter.id : null
    }

    console.log("recruiter")
    console.log(id)

    if (id !== undefined) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParamALL = `?date_range=${this.dateRange}&recruiter_id=${id}`
        apiParam = `?date_range=${this.dateRange}`
      } else {
        apiParamALL = `?start_date=${this.startDate}&end_date=${this.endDate}&recruiter_id=${id}`
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}`
      }


    } else {
    if (this.dateRange !== ReportDateRange.CUSTOM) {
      apiParamALL = `?date_range=${this.dateRange}`
      apiParam = `?date_range=${this.dateRange}`
    } else {
      apiParamALL = `?start_date=${this.startDate}&end_date=${this.endDate}`
      apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}`
    }
    console.log("recruiter2")
    console.log(apiParam)
    }
    console.log("recruiter")
    console.log(apiParam)


    forkJoin([
      this._api.getReportWithApiLink(`/reports/recruiter_calls_performance_summary_table/${apiParam}`),
      this._api.getReportWithApiLink(`/reports/recruiter_calls_performance_summary_alldata_by_job_id/${apiParamALL}`),
      this._api.getReportWithApiLink(`/reports/recruiter_calls_performance_summary_graph/${apiParam}`),
      // this._api.getReportWithApiLink(`${this.user_api}${this.user_role}`)
    ])
      .subscribe((res: Array<any>) => {
        this.summarData = res[0];
        this.allData = res[1];
        this.getStatus(res[2]);
        // this.allUsers = res[3];
        // this.allUsers.forEach(_ => {
        //   this.setForJobSummary.add(_.bdm_name);
        // })
        this.dataSelection();
      }, error => {
        console.log(error);
      })


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
      if (_.country !== "--") {
        this.setForJobSummaryCountry.add(_.country);
      }
      // this.xAxisCountryFilterArray.push(_.client_country);
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
    this.filterOnTableRPS(this.bdmName, this.clientCountry);
    this.filterRecruiterRPS(this.bdmName, this.clientCountry);
    // if (this.tag === "job_summary") {
    //   this.filterOnTableBdm(this.bdmName, this.clientCountry);
    // }
    // this.xAxisFilter = 'ALL'
    // this.bdmName = 'ALL'
    // this.clientName = 'ALL'
    console.log(this.xAxisCountryFilterArray);
  }


  filterOnTableRPS(recruiter: string, country: string,  isLoad:boolean = false) {
    this.bdmName = recruiter;
    this.clientCountry = country;
    if(isLoad){
      this.getSubmissionData()
    }else{
    this.tabularDataForFilter = this.tabularData;
    if (recruiter === 'ALL' && (country === 'none' || country === 'ALL')) {
      this.tabularDataForFilter = this.tabularData;
    }

    else if (recruiter === 'ALL' && country !== 'none') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (country === _.country) {
          // console.log(_)
          return _;
        }
      })
    }
    else if (recruiter !== 'ALL' && country === 'ALL') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (_.recruiter_name.includes(recruiter)) {
          // console.log(_)
          return _;
        }
      })
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (_.recruiter_name.includes(recruiter) && country === _.country) {
          // console.log(_)
          return _;
        }
      })
    }
    }


  }
  filterRecruiterRPS(recruiter: string, country: string): void {
    this.bdmName = recruiter;
    const jobSummary = new Set<Label>();
    // console.log(this.data)
    this.chartLabels = [];
    this.isCompleted = false;
    // if (bdm === 'ALL') {
    //   this.chartLabels = Array.from(this.getAllXAxisLabel());
    //   this.tabularData;

    // } else {
    //   this.data.forEach(_ => {
    //     if (_.bdm_name === bdm && _.total_count > 0) {
    //       jobSummary.add(_.job_title);
    //     }
    //   });
    //   this.chartLabels = Array.from(jobSummary) as Array<string>;
    //   // this.chartLabels = [event];

    // }

    // console.log(recruiter);
    // console.log(recruiter.split(" ")[0]);
    // console.log(this.data);
    // console.log(country);

    if (recruiter === 'ALL' && (country === 'none' || country === 'ALL')) {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    }


    else if (recruiter === 'ALL' && country !== 'none') {
      this.data.forEach(_ => {
        if (_.country === country && _.total_count > 0) {
          jobSummary.add(_.first_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else if (recruiter !== 'ALL' && country === 'ALL') {
      this.data.forEach(_ => {
        if (recruiter.includes(_.first_name) && _.total_count > 0) {
          jobSummary.add(_.first_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else {
      this.data.forEach(_ => {
        if (recruiter.includes(_.first_name) && _.country === country && _.total_count > 0) {
          jobSummary.add(_.first_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    // console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }


  downloadCsvFileRP(): void {
    var apiParam = `date_range=${this.dateRangeSelected}`;
    var fileName = 'recruiter_performance'
    if (this.dateRangeSelected == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }


    let id;
    var recruiter

    if (this.allUsers !== undefined && this.allUsers !== null) {
      recruiter = this.findRecruiterIdRP(this.xAxisFilter);
    }
    console.log(recruiter)
    if (recruiter) {
      id = (recruiter != undefined) ? recruiter.id : null
    }

    if (id) {
      // if (this.dateRange !== ReportDateRange.CUSTOM) {
      apiParam += `&recruiter_id=${id}&country=${this.clientCountry}`
      // } else {
      //   apiParam = `&recruiter_id=${id}&country=${this.clientCountry}`
      // }
    } else {
      // if (this.dateRange !== ReportDateRange.CUSTOM) {
      apiParam += `&country=${this.clientCountry}`
      // } else {
      //   apiParam += `&end_date=${this.endDate}&country=${this.clientCountry}`
      // }
    }

    var csv_api;
    if (this.dataType === "Summary") {
      apiParam += `&data_type=summary`;
      csv_api = `/reports/recruiter_calls_performance_summary_csv/?${apiParam}`;
    } else {
      apiParam += `&data_type=all_data`;
      fileName = 'recruiter_performance_details'
      csv_api = `/reports/recruiter_calls_performance_summary_alldata_by_job_id_csv/?${apiParam}`;
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

  columnDefsSum = [


    { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true },
    { headerName: "Recruiter Jobs", field: "job_title", sortable: true, filter: true },
    // { headerName: "Connected Calls", field: "connected_calls", sortable: true, filter: true },
    // { headerName: "Missed Calls", field: "missed_calls", sortable: true, filter: true },
    { headerName: "Attempted Calls", field: "attempted_calls", sortable: true, filter: true },
    { headerName: "Submission", field: "Submission", sortable: true, filter: true },
    { headerName: "Submission Rejected", field: "SubmissionReject", sortable: true, filter: true },
    { headerName: "Internal Submission", field: "InternalSubmission", sortable: true, filter: true },
    { headerName: "Internal Submission Rejected", field: "InternalSubmissionReject", sortable: true, filter: true },
    { headerName: "Internal Interview", field: "InternalInterview", sortable: true, filter: true },
    { headerName: "Internal Interview Rejected", field: "InternalInterviewReject", sortable: true, filter: true },
    { headerName: "Internal Shortlisted", field: "InternalShortlisted", sortable: true, filter: true },
    { headerName: "Internal Offered", field: "InternalOffered", sortable: true, filter: true },
    { headerName: "Internal Offered Rejected", field: "InternalOfferedReject", sortable: true, filter: true },
    { headerName: "Internal Placed", field: "InternalPlaced", sortable: true, filter: true },
    { headerName: "SendOut to Client", field: "SendOuttoClient", sortable: true, filter: true },
    { headerName: "SendOut", field: "SendOut", sortable: true, filter: true },
    { headerName: "SendOut Rejected", field: "SendoutReject", sortable: true, filter: true },

    { headerName: "Interview", field: "ClientInterview", sortable: true, filter: true },
    { headerName: "Interview Rejected", field: "RejectedByClient", sortable: true, filter: true },
    { headerName: "Shortlisted", field: "Shortlisted", sortable: true, filter: true },
    { headerName: "Offered", field: "Offered", sortable: true, filter: true },
    { headerName: "Offer Rejected", field: "OfferRejected", sortable: true, filter: true },
    { headerName: "Placed", field: "Placed", sortable: true, filter: true },





    { headerName: "Country", field: "country", sortable: true, filter: true },



  ];

  columnDefsAll = [
    { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true },
    { headerName: "Job Title", field: "job_title", sortable: true, filter: true },
    // { headerName: "Assignment Type", field: "assignment_type", sortable: true, filter: true,  },
    { headerName: "Candidate Name", field: "candidate_name", sortable: true, filter: true },
    { headerName: "Submitted On", field: "submitted_on", sortable: true, filter: true },
    { headerName: "Current Status", field: "current_status", sortable: true, filter: true },
    { headerName: "Last Updated on", field: "last_updated_on", sortable: true, filter: true },
    { headerName: "Total Exp", field: "total_exp", sortable: true, filter: true },
    { headerName: "Max Salary", field: "max_salary", sortable: true, filter: true },
    { headerName: "Min Salary", field: "min_salary", sortable: true, filter: true },
    { headerName: "Remarks", field: "remarks", sortable: true, filter: true, width: 1000 },
    // { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true },
  ];

  // columnDefsAll = [


  //   { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true },
  //   { headerName: "Recruiter Jobs", field: "job_title", sortable: true, filter: true },
  //   { headerName: "Date", field: "job_posted_date", sortable: true, filter: true },
  //   { headerName: "No of openings", field: "number_of_opening", sortable: true, filter: true },
  //   // { headerName: "Connected Calls", field: "connected_calls", sortable: true, filter: true },
  //   // { headerName: "Missed Calls", field: "missed_calls", sortable: true, filter: true },
  //   // { headerName: "Attempted Calls", field: "attempted_calls", sortable: true, filter: true },
  //   { headerName: "Submission", field: "Submission", sortable: true, filter: true },
  //   { headerName: "Submission Rejected", field: "SubmissionReject", sortable: true, filter: true },
  //   { headerName: "SendOut", field: "SendOut", sortable: true, filter: true },
  //   { headerName: "SendOut Rejected", field: "SendoutReject", sortable: true, filter: true },
  //   { headerName: "Interview", field: "ClientInterview", sortable: true, filter: true },
  //   { headerName: "Interview Rejected", field: "RejectedByClient", sortable: true, filter: true },
  //   { headerName: "Shortlisted", field: "Shortlisted", sortable: true, filter: true },
  //   { headerName: "Offered", field: "Offered", sortable: true, filter: true },
  //   { headerName: "Offer Rejected", field: "OfferRejected", sortable: true, filter: true },
  //   { headerName: "Placed", field: "Placed", sortable: true, filter: true },
  //   { headerName: "Placed", field: "Placed", sortable: true, filter: true },
  //   { headerName: "Max Salary", field: "max_salary", sortable: true, filter: true },
  //   { headerName: "Min Salary", field: "min_salary", sortable: true, filter: true },
  //   { headerName: "Max Rate", field: "max_rate", sortable: true, filter: true },
  //   { headerName: "Min Rate", field: "min_rate", sortable: true, filter: true },
  //   { headerName: "Mode of interview", field: "mode_of_interview", sortable: true, filter: true },
  //   { headerName: "Mode of work", field: "mode_of_work", sortable: true, filter: true },
  //   { headerName: "Notice period", field: "notice_period", sortable: true, filter: true },
  //   { headerName: "Project revenue", field: "projected_revenue", sortable: true, filter: true },
  //   { headerName: "Country", field: "country", sortable: true, filter: true },

  // ];



  // filterOnTable(event: string) {
  //   this.tabularDataForFilter = this.tabularData;
  //   if (event === 'ALL') {
  //     this.tabularDataForFilter = this.tabularData;
  //   }
  //   else {

  //     this.tabularDataForFilter = this.tabularData.filter(_ => {
  //       if (event === _.recruiter_name.split(" ")[0]) {
  //         return _;
  //       }
  //     })
  //   }
  // }

  getRole() {
    this.auth.getRole().subscribe(res => {
      this.role = res;
    })
  }


}
