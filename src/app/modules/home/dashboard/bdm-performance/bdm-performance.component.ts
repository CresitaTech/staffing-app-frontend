import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RecruiterGraphUnit, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { Roles } from 'src/app/enums/role.enum';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BaseReportComponent } from '../base-report/base-report.component';
import { Label } from 'ng2-charts';
import { Observable } from 'rxjs';
import { Constants } from 'src/app/enums/constants.enum';
import { User } from 'src/app/models/user';
import { APIPath } from 'src/app/enums/api-path.enum';

@Component({
  selector: 'app-bdm-performance',
  templateUrl: './bdm-performance.component.html',
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
export class BdmPerformanceComponent extends BaseReportComponent<RecruiterGraphUnit> implements OnInit {

  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;
  public gridApi;

  // graph_api = '/reports/bdm_performance_summary_graph/';
  graph_api = '/reports/bdm_performance_summary_graph/';
  tag = ReportTags.BDM;
  table_api = '/reports/bdm_performance_summary_table/';
  csv_api = '/reports/bdm_performance_summary_csv/'
  label_name = 'first_name'
  @Input() pageToBeLoaded;
  role: Roles;
  roles = Roles;
  api_path = APIPath.USER_ROLE;
   noRowsTemplate;
   loadingTemplate;
  constructor(
    _api: APIProviderService<RecruiterGraphUnit>,
    modal: NgbModal,
    private auth: AuthService
  ) { super(_api, modal); this.getRole();

    this.loadingTemplate =
    `<span class="ag-overlay-loading-center">data is loading...</span>`;
  this.noRowsTemplate =
    `"<span">no rows to show</span>"`;}

  ngOnInit(): void {
    this.user_role = "9";
    this.xAxisFilterCountry = "ALL"
    // this.xAxisFilter = null;
    // if(this.pageToBeLoaded==='dashboard'){
    //       this._api.getReportWithApiLink(`${this.graph_api}?date_range=${this.dateRange}`)
    //       .subscribe((res: Array<any>) => {
    //         this.getStatus(res);
    //         this.xAxisFilter='ALL'
    //       },error=>{
    //         console.log(error);
    //       })

    // }
    // else

    this.getUserForSelection().subscribe(() => {
      console.log("xAxisFilter: " + this.xAxisFilter);
      console.log("xAxisFilterCountry: " + this.xAxisFilterCountry);

      this.getData(`?date_range=${this.dateRange}`);
      this.filterOnTableBC(this.xAxisFilter, this.xAxisFilterCountry);
      this.filterRecruiterBC(this.xAxisFilter, this.xAxisFilterCountry);
    });
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
    console.log("dateRangeSelected: " + this.dateRange);

    this.filterOnTableBC(this.xAxisFilter, this.xAxisFilterCountry);
    this.filterRecruiterBC(this.xAxisFilter, this.xAxisFilterCountry);
    this.dateRangeChanged(this.dateRange);

    if (this.dateRange === ReportDateRange.CUSTOM) {
      this.dateRangeSelection();
    }
  }

  onXAxisFilterChange(event: any): void {
    this.xAxisFilter = event;
  }

  onXAxisFilterCountryChange(event: any): void {
    this.xAxisFilterCountry = event;
  }


  columnDefs = [
    { headerName: "Candidate Name", field: "candidate_name", sortable: true, filter: true },
    { headerName: "Candidate Stage", field: "status", sortable: true, filter: true },
    { headerName: "Job Title", field: "job_title", sortable: true, filter: true },
    { headerName: "Total Experience", field: "total_experience", sortable: true, filter: true },
    { headerName: "Min Salary($)", field: "min_salary", sortable: true, filter: true },
    { headerName: "Max Salary($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Min Rate($)", field: "min_rate", sortable: true, filter: true },
    { headerName: "Max Rate($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Client Name", field: "client_name", sortable: true, filter: true },
    { headerName: "Client Country", field: "client_country", sortable: true, filter: true },
    { headerName: "BDM Name", field: "bdm_name", sortable: true, filter: true },
    { headerName: "Recruiter Name", field: "submitted_by", sortable: true, filter: true },
    { headerName: "Candidate Location", field: "location", sortable: true, filter: true },
    { headerName: "Visa", field: "visa", sortable: true, filter: true },
    { headerName: "Job Type", field: "job_type", sortable: true, filter: true },
    { headerName: "Submission Date", field: "submission_date", sortable: true, filter: true },
    { headerName: "Assignment Date", field: "first_assingment_date", sortable: true, filter: true },
    { headerName: "Job Date", field: "job_date", sortable: true, filter: true },
    { headerName: "Remarks", field: "remarks", sortable: true, filter: true },

  ];






  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }


  filterOnTableBC(bdmName: string, country: string) {
    this.bdmName = bdmName;
    this.clientCountry = country;
    this.tabularDataForFilter = this.tabularData;
    if (bdmName === 'ALL' && (country === 'none' || country === 'ALL' )) {
      this.tabularDataForFilter = this.tabularData;
    }

    else if (bdmName === 'ALL' && country !== 'none') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (country === _.client_country) {
          // console.log(_)
          return _;
        }
      })
    }
    else if (bdmName !== 'ALL' && country === 'ALL') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (bdmName === _.bdm_name) {
          // console.log(_)
          return _;
        }
      })
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (bdmName === _.bdm_name && country === _.client_country) {
          // console.log(_)
          return _;
        }
      })
    }
  }
  filterRecruiterBC(bdm: string, country: string): void {
    this.bdmName = bdm;
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

    console.log(bdm);
    console.log(bdm.split(" ")[0]);
    console.log(this.data);
    console.log(country);

    if (bdm === 'ALL' && (country === 'none' || country === 'ALL' )) {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    }


    else if (bdm === 'ALL' && country !== 'none') {
      this.data.forEach(_ => {
        if (_.country === country && _.total_count > 0) {
          jobSummary.add(_.first_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else if (bdm !== 'ALL' && country === 'ALL') {
      this.data.forEach(_ => {
        if ( bdm.includes(_.first_name) && _.total_count > 0) {
          jobSummary.add(_.first_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else {
      this.data.forEach(_ => {
        if (bdm.includes(_.first_name)  && _.country === country && _.total_count > 0) {
          jobSummary.add(_.first_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    // console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }

  onGridReady(params) {
    this.gridApi = params.api;
  }



  getRole() {
    this.auth.getRole().subscribe(res => {
      this.role = res;
    })
  }

}
