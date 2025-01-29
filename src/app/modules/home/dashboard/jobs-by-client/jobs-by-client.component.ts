import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Label } from 'ng2-charts';
import { JobSummaryGraphUnit, RecruiterGraphUnit, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { Roles } from 'src/app/enums/role.enum';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BaseReportComponent } from '../base-report/base-report.component';
import { Observable, forkJoin } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-jobs-by-client',
  templateUrl: './jobs-by-client.component.html',
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
    `
  ],
  providers: [OrderByDatePipe]
})
export class JobsByClientComponent extends BaseReportComponent<JobSummaryGraphUnit> implements OnInit {

  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;
  public gridApi;

  graph_api = '/reports/job_submissions_by_client_graph/';
  table_api = '/reports/job_submissions_by_client_table/';
  csv_api = '/reports/job_submissions_by_client_csv/';
  label_name = 'company_name';
  tag = ReportTags.JOBS_BY_CLIENT;

  api_path = APIPath.USER_ROLE;

  constructor(
    _api: APIProviderService<JobSummaryGraphUnit>,
    modal: NgbModal,
    private auth: AuthService
  ) { super(_api, modal); }

  ngOnInit(): void {
    this.xAxisFilter = "ALL";
    // this.xAxisFilterBDM = null;
    this.xAxisFilterCountry = "ALL";
    this.user_role = "client";
    // this.getData(`?date_range=${this.dateRange}`);
    // this.getBDMS();

    // this.tabularData.forEach(item=>{
    //   if(item.job_date)
    //   item.job_date=  moment(item.job_date).format('MM/DD/YYYY');
    // })

    this.getUserForSelection().subscribe(() => {
      console.log("xAxisFilter: " + this.xAxisFilter);
      console.log("xAxisFilterBDM: " + this.xAxisFilterBDM);
      console.log("xAxisFilterCountry: " + this.xAxisFilterCountry);

      this.getData(`?date_range=${this.dateRange}`);
      this.filterOnTableJBCLIENT(this.xAxisFilter, this.xAxisFilterBDM, this.xAxisFilterCountry);
      this.filterJobsByClientClient(this.xAxisFilter, this.xAxisFilterBDM, this.xAxisFilterCountry);
    });
  }

  getUserForSelection(): Observable<any> {
    return new Observable((observer) => {
      this.auth.getLoggedinUser(sessionStorage.getItem(Constants.USER_ID)).subscribe((user: User) => {
          const fullName = user.first_name + " " + user.last_name;
          const apiPath = `${this.api_path}9`;
          this._api.getReportWithApiLink(apiPath).subscribe((data: any[]) => {
              const bdmNames = data.map(item => item.bdm_name);
              if (bdmNames.includes(fullName)) {
                  this.xAxisFilterBDM = fullName;
              } else {
                  this.xAxisFilterBDM = "ALL";
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
    console.log("xAxisFilterBDM: " + this.xAxisFilterBDM);
    console.log("xAxisFilterCountry: " + this.xAxisFilterCountry);
    console.log("dateRangeSelected: " + this.dateRange);

    this.filterOnTableJBCLIENT(this.xAxisFilter, this.xAxisFilterBDM, this.xAxisFilterCountry);
    this.filterJobsByClientClient(this.xAxisFilter, this.xAxisFilterBDM, this.xAxisFilterCountry);
    this.dateRangeChanged(this.dateRange);

    if (this.dateRange === ReportDateRange.CUSTOM) {
      this.dateRangeSelection();
    }
  }

  onXAxisFilterChange(event: any): void {
    this.xAxisFilter = event;
  }

  onXAxisFilterBDMChange(event: any): void {
    this.xAxisFilterBDM = event;
  }

  onXAxisFilterCountryChange(event: any): void {
    this.xAxisFilterCountry = event;
  }

  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }

  onGridReady(params) {
    this.gridApi = params.api;
  }

  filterOnTableJS(clientName: string, country: string, status: string) {
    this.clientName = clientName;
    this.clientCountry = country;
    this.tabularDataForFilter = this.tabularData;
    if (clientName === 'ALL' && (country === 'none' || country === 'ALL') && (status === 'ALL' || status === 'none')) {
      this.tabularDataForFilter = this.tabularData;
    }

    else if (clientName === 'ALL' && country !== 'none') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (country === _.client_country) {
          // console.log(_)
          return _;
        }
      })
    }
    else if (clientName !== 'ALL' && country === 'ALL') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (clientName === _.client_name) {
          // console.log(_)
          return _;
        }
      })
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (clientName === _.client_name && country === _.client_country) {
          // console.log(_)
          return _;
        }
      })
    }

    if (status !== 'none' && status !== 'ALL') {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        if (status === _.status) {
          // console.log(_)
          return _;
        }
      })
    }
  }

  filterRecruiter(event: string): void {
    this.clientName = event;
    const jobSummary = new Set<Label>();
    //console.log(this.data)
    this.chartLabels = [];
    this.isCompleted = false;
    if (event === 'ALL') {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;

    } else {
      this.data.forEach(_ => {
        console.log(_)
        if (_.company_name === event) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
      // this.chartLabels = [event];
    }
    // console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }

  filterOnTableCRLT(recruiter: string, country: string) {
    this.clientName = recruiter;
    this.clientCountry = country;
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
        if (_.client_name.includes(recruiter)) {
          // console.log(_)
          return _;
        }
      })
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (_.client_name.includes(recruiter) && country === _.country) {
          // console.log(_)
          return _;
        }
      })
    }
  }

  filterOnTableJBCLIENT(client: string, bdm: string, country: string) {
    this.clientName = client;
    this.clientCountry = country;
    this.tabularDataForFilter = this.tabularData;
    if (client === 'ALL' && (country === 'none' || country === 'ALL') && (bdm === 'none' || bdm === 'ALL')) {
      this.tabularDataForFilter = this.tabularData;
    }

    if (client !== 'ALL' && client !== 'none') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (_.client_name.includes(client)) {
          // console.log(_)
          return _;
        }
      })
    }
    if (bdm !== 'none' && bdm !== 'ALL') {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        if (bdm === _.bdm_name) {
          // console.log(_)
          return _;
        }
      })
    }
    if (country !== 'none' && country !== 'ALL') {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        if (country === _.country) {
          // console.log(_)
          return _;
        }
      })
    }
    // else if((country !== 'none' && country !== 'ALL' ) && (bdm !== 'none' && bdm !== 'ALL' )){
    //   this.tabularDataForFilter = this.tabularData.filter(_ => {
    //     if (_.client_name.includes(client) && country === _.country) {
    //       // console.log(_)
    //       return _;
    //     }
    //   })
    // }


  }



  filterOnTable(event: string) {
    this.tabularDataForFilter = this.tabularData;
    if (event === 'ALL') {
      this.tabularDataForFilter = this.tabularData;
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (event === _.client_name) {
          // console.log(_)
          return _;
        }
      })
    }
  }


  columnDefs = [
    { headerName: "Client Name", field: "client_name", sortable: true, filter: true },
    { headerName: "Total Jobs", field: "total_jobs", sortable: true, filter: true },
    { headerName: "Submission", field: "Submission", sortable: true, filter: true },
    { headerName: "Submission Reject", field: "SubmissionReject", sortable: true, filter: true },
    { headerName: "Internal Interview", field: "InternalInterview", sortable: true, filter: true },
    { headerName: "Internal Interview Reject", field: "InternalInterviewReject", sortable: true, filter: true },
    { headerName: "Candidate Review", field: "CandidateReview", sortable: true, filter: true },
    { headerName: "Hold by BDM", field: "HoldbyBDM", sortable: true, filter: true },
    { headerName: "Send Out", field: "SendOut", sortable: true, filter: true },
    { headerName: "Send Out Reject", field: "SendoutReject", sortable: true, filter: true },
    { headerName: "Client Interview", field: "ClientInterview", sortable: true, filter: true },
    { headerName: "Hold by Client", field: "HoldbyClient", sortable: true, filter: true },
    { headerName: "Interview Backout", field: "InterviewBackout", sortable: true, filter: true },
    { headerName: "Rejected By Client", field: "RejectedByClient", sortable: true, filter: true },

    { headerName: "Awaiting Feedback", field: "FeedbackAwaited", sortable: true, filter: true },
    { headerName: "Shortlisted", field: "Shortlisted", sortable: true, filter: true },
    { headerName: "Offered", field: "Offered", sortable: true, filter: true },
    { headerName: "Offer Rejected", field: "OfferRejected", sortable: true, filter: true },
    { headerName: "Offer Backout", field: "OfferBackout", sortable: true, filter: true },
    { headerName: "Placed", field: "Placed", sortable: true, filter: true },


    // { headerName: "Rejected By Team", field: "RejectedByTeam", sortable: true, filter: true },
    // { headerName: "Interview Select", field: "InterviewSelect", sortable: true, filter: true },

    // { headerName: "Candidate Added", field: "CandidateAdded", sortable: true, filter: true },
    // { headerName: "Client Interview First", field: "ClientInterviewFirst", sortable: true, filter: true },
    // { headerName: "Client Interview Second", field: "ClientInterviewSecond", sortable: true, filter: true },
    { headerName: "Interview Reject", field: "InterviewReject", sortable: true, filter: true },
    // { headerName: "Second Interview Reject", field: "SecondInterviewReject", sortable: true, filter: true },
    // { headerName: "Still Submission", field: "StillSubmission", sortable: true, filter: true },

    { headerName: "Client Country", field: "country", sortable: true, filter: true },
    { headerName: "BDM Name", field: "bdm_name", sortable: true, filter: true },


  ];

  protected getBDMS(): void {
    this.setBDMS = new Set();

    forkJoin([

      this._api.getReportWithApiLink(`${this.user_api}9`)
    ])
      .subscribe((res: Array<any>) => {

        this.allBDMS = res[0];
        this.allBDMS.forEach(_ => {
          this.setBDMS.add(_.bdm_name);
        })

      }, error => {
        console.log(error);
      })
  }


}
