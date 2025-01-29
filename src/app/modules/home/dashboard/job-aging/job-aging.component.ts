import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RecruiterGraphUnit, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { Roles } from 'src/app/enums/role.enum';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BaseReportComponent } from '../base-report/base-report.component';
import { Label } from 'ng2-charts';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Observable } from 'rxjs';
import { Constants } from 'src/app/enums/constants.enum';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-job-aging',
  templateUrl: './job-aging.component.html',
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
export class JobAgingComponent extends BaseReportComponent<RecruiterGraphUnit> implements OnInit {

  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;
  public gridApi;

  graph_api = '/reports/active_jobs_aging_graph/';
  tag = ReportTags.JOB_AGE;
  table_api = '/reports/active_jobs_aging_table/';
  csv_api = '/reports/active_jobs_aging_csv/'
  label_name = 'job_title'

  role: Roles;
  roles = Roles;
  api_path = APIPath.USER_ROLE;

  constructor(
    _api: APIProviderService<RecruiterGraphUnit>,
    modal: NgbModal,
    private auth: AuthService
  ) { super(_api, modal); this.getRole(); }

  ngOnInit(): void {
    this.user_role = "9";
    this.getUserForSelection().subscribe(() => {
      console.log("xAxisFilter: " + this.xAxisFilter);

      this.getData(`?date_range=${this.dateRange}`);
      this.filterOnTable(this.xAxisFilter);
      this.filterRecruiter(this.xAxisFilter);
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
                  this.bdmName = fullName;
              } else {
                  this.xAxisFilter = "ALL";
                  this.bdmName = "ALL";
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
    console.log("dateRangeSelected: " + this.dateRange);

    this.filterOnTable(this.xAxisFilter);
    this.filterRecruiter(this.xAxisFilter);
    this.dateRangeChanged(this.dateRange);

    if (this.dateRange === ReportDateRange.CUSTOM) {
      this.dateRangeSelection();
    }
  }

  onXAxisFilterChange(event: any): void {
    this.xAxisFilter = event;
  }

  filterRecruiter(bdmName: string): void {
    //  console.log(this.data)
    this.bdmName = bdmName;
    const jobAge = new Set<Label>();
    this.chartLabels = [];
    this.isCompleted = false;
    if (bdmName === 'ALL') {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;

    } else {
      this.data.forEach(_ => {
        if (_.bdm_name === bdmName && _.job_age > 0)
          jobAge.add(_.job_title);
      });
      this.chartLabels = Array.from(jobAge) as Array<string>;
      // this.chartLabels = [event];

    }
    //   console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }




  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }


  filterOnTable(bdmName: string) {
    this.tabularDataForFilter = this.tabularData;
    if (bdmName === 'ALL') {
      this.tabularDataForFilter = this.tabularData;
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (bdmName === _.bdm_name) {
          // console.log(_)
          return _;
        }
      })
    }
  }



  columnDefs = [
    { headerName: "BDM Name", field: "bdm_name", sortable: true, filter: true },
    { headerName: "Client Name", field: "company_name", sortable: true, filter: true },
    { headerName: "Client Country", field: "country", sortable: true, filter: true },
    { headerName: "First Assignment Date", field: "first_assingment_date", sortable: true, filter: true },
    { headerName: "First Submission Date", field: "first_submission_date", sortable: true, filter: true },
    { headerName: "Primary Recruiter", field: "primary_recruiter_name", sortable: true, filter: true },
    { headerName: "Secondary Recruiter", field: "secondary_recruiter_name", sortable: true, filter: true },
    { headerName: "Job Title", field: "job_title", sortable: true, filter: true },
    { headerName: "Job ID", field: "job_id", sortable: true, filter: true },
    { headerName: "Posted Date", field: "posted_date", sortable: true, filter: true },
    { headerName: "Job Age", field: "job_age", sortable: true, filter: true },
  ];


  onGridReady(params) {
    this.gridApi = params.api;
  }



  getRole() {
    this.auth.getRole().subscribe(res => {
      this.role = res;
    })
  }

}
