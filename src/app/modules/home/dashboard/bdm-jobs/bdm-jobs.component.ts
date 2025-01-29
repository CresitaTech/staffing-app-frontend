import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RecruiterGraphUnit, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { Roles } from 'src/app/enums/role.enum';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { BaseReportComponent } from '../base-report/base-report.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Observable } from 'rxjs';
import { Constants } from 'src/app/enums/constants.enum';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-bdm-jobs',
  templateUrl: './bdm-jobs.component.html',
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
})
export class BdmJobsComponent extends BaseReportComponent<RecruiterGraphUnit> implements OnInit {

  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;
  public gridApi;

  graph_api = '/reports/jobs_by_bdm_summary_graph/';
  csv_api = '/reports/jobs_by_bdm_summary_csv/'
  tag = ReportTags.BDM_JOBS;
  table_api = '/reports/jobs_by_bdm_summary_table/';
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
    if (this.dateRange === ReportDateRange.CUSTOM)
      this.label_name = 'month';
    else
      this.label_name = 'created_at';

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


  columnDefs = [
    { headerName: "Job Posted Date", field: "created_at", sortable: true, filter: true },
    { headerName: "Client", field: "client_name.company_name", sortable: true, filter: true },
    { headerName: "Job Title", field: "job_title", sortable: true, filter: true },
    { headerName: "Min Salary($)", field: "min_salary", sortable: true, filter: true },
    { headerName: "Max Salary($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Min Rate($)", field: "min_rate", sortable: true, filter: true },
    { headerName: "Max Rate($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "BDM Name", field: "full_name", sortable: true, filter: true },
    { headerName: "Job ID", field: "job_id", sortable: true, filter: true },
  ];




  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }


  //Over ridden filter recruiter method

  filterRecruiter(bdmName: string): void {
    this.bdmName = bdmName;
    //console.log(this.data)
    this.chartLabels = [];
    this.isCompleted = false;
    if (bdmName === 'ALL') {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;

    } else {
      if (this.tag === 'bdm_job' && this.label_name === "created_at") {
        //   this.bdmName=event;
        console.log(bdmName)
        this.data.forEach(_ => {
          if (_.bdm_name === bdmName && _.total_count > 0)
            this.chartLabels.push(_.created_at.split(" ")[0]);
        });
      }
      else if (this.tag === 'bdm_job' && this.label_name === "month") {
        this.data.forEach(_ => {
          if (_.bdm_name === bdmName && _.total_count > 0)
            this.chartLabels.push(_.month + " '" + _.created_at.substr(2, 2));
        });
      }
      // this.chartLabels = [event];

    }
    // console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }


  filterOnTable(bdmName: string) {
    this.tabularDataForFilter = this.tabularData;
    if (bdmName === 'ALL') {
      this.tabularDataForFilter = this.tabularData;
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (bdmName === _.full_name) {
          // console.log(_)
          return _;
        }
      })
    }
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
