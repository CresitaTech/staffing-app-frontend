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
//declare const $: any;

@Component({
  selector: 'app-candidate-report',
  templateUrl: './candidate-report.component.html',
  styleUrls: ['./candidate-report.component.scss'],
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
export class CandidateReportComponent extends BaseReportComponent<RecruiterGraphUnit> implements OnInit {

  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;

  graph_api = '/reports/candidate_graph/';
  tag = ReportTags.CANDIDATE_REPORT;
  table_api = '/reports/candidate_table/';
  csv_api = '/reports/candidate_csv/'
  label_name = 'first_name'
  @Input() pageToBeLoaded;
  public gridApi;
  isCandidateAdded: false;

  role: Roles;
  roles = Roles;
  api_path = APIPath.USER_ROLE;
  constructor(
    _api: APIProviderService<RecruiterGraphUnit>,
    modal: NgbModal,
    private auth: AuthService
  ) {
    super(_api, modal);
    this.getRole();
  }

  ngOnInit(): void {
    this.user_role = "3";
    // this.xAxisFilter = null;
    this.xAxisFilterCountry="ALL";
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

    this.getUserForSelection().subscribe(() => {
      console.log("xAxisFilter: " + this.xAxisFilter);
      console.log("xAxisFilterCountry: " + this.xAxisFilterCountry);

      this.getData(`?date_range=${this.dateRangeToday}`);
      this.filterOnTableCR(this.xAxisFilter, this.xAxisFilterCountry);
      this.filterRecruiterCR(this.xAxisFilter, this.xAxisFilterCountry);
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
    console.log("dateRangeSelected: " + this.dateRangeSelected);

    this.filterOnTableCR(this.xAxisFilter, this.xAxisFilterCountry);
    this.filterRecruiterCR(this.xAxisFilter, this.xAxisFilterCountry);
    this.dateRangeChanged(this.dateRangeSelected);

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

  onCandidateaddedSelect(value) {
    this.isCandidateAdded = value;
    if(this.isCandidateAdded){
      this.getData(`?date_range=${this.dateRange}&stage_name=canddate_added`);
    }else{
      this.getData(`?date_range=${this.dateRange}`);
    }
  }
  filterOnTableCR(recruiter: string, country: string) {
    this.bdmName = recruiter;
    this.clientCountry = country;
    this.tabularDataForFilter = this.tabularData;
    if (recruiter === 'ALL' && (country === 'none' || country === 'ALL' )) {
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
    console.table(this.tabularDataForFilter);
  }
  filterRecruiterCR(recruiter: string, country: string): void {
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

    if (recruiter === 'ALL' && (country === 'none' || country === 'ALL' )) {
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
        if ( recruiter.includes(_.first_name) && _.total_count > 0) {
          jobSummary.add(_.first_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else {
      this.data.forEach(_ => {
        if (recruiter.includes(_.first_name)  && _.country === country && _.total_count > 0) {
          jobSummary.add(_.first_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    // console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }
  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }

  onGridReady(params) {
    this.gridApi = params.api;
  }


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
