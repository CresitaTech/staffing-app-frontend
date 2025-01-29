import { Component, Input, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Label } from 'ng2-charts';
import { JobSummaryGraphUnit, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { BaseReportComponent } from '../base-report/base-report.component';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';

import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { Observable, forkJoin } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Constants } from 'src/app/enums/constants.enum';
import { User } from 'src/app/models/user';


@Component({
  selector: 'app-job-summary',
  templateUrl: './job-summary.component.html',
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

      .close-icon {
        font-size: 1.2rem;
        color: red;
      }

      .close-icon-active {
        font-size: 1.2rem;
        color: #ffffff;
      }

      ::ng-deep .mat-tab-label-container .mat-tab-list {
        display: none;
}


    `
  ],
  providers: [OrderByDatePipe]
})


export class JobSummaryComponent extends BaseReportComponent<JobSummaryGraphUnit> implements OnInit {

  options: string[] = ['ALL', 'Active', 'Inactive', 'Rejected',
  'SubmissionNotAccepted','RejectedForRate'];
  empType: string[] = ['ALL', 'C2C', 'C2H', 'FullTime', 'W2'];
  // selectedOptions: string[] = [];
  // selectedEmpType: string[] = [];
  optionButtonText = 'Select Job Status';
  employeeButtonText = 'Employement Type';
  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;
  public gridApi;

  graph_api = '/reports/job_summary_graph/';
  table_api = '/reports/job_summary_table/';
  csv_api = '/reports/job_summary_csv/';
  label_name = 'job_title';
  tag = ReportTags.JOB_SUMMARY;
  public rowSelection;
  frameworkComponents: any;
  api_path = APIPath.USER_ROLE;
  constructor(
    private router: Router,
    _api: APIProviderService<JobSummaryGraphUnit>,
    modal: NgbModal,
    public modalService: NgbModal,
    private auth: AuthService
  ) { super(_api, modal); }
  public rowData: any;

  selected = new FormControl(0);
  private gridColumnApi;
  @ViewChild(MatTabGroup, { read: MatTabGroup })
  public tabGroup: MatTabGroup;
  @ViewChildren(MatTab, { read: MatTab })
  // public tabNodes: QueryList<MatTab>;
  public closedTabs: any;
  public tabs = [{
    tabType: 0,
    name: 'Job Summary',
    summaryData: 'Main',
    allData: 'Main',
    job_id: "",
    job_title: "",
    bdm: "",
    dataType: 'Summary',
    startDate: this.startDate,
    endDate: this.endDate,
    dateRange: this.dateRange,
    country: this.clientCountry,
    rId: "",
    rName: ""
  },];

  ngOnInit(): void {

    // this.xAxisFilter = "ALL";
    this.xAxisFilterCountry = "ALL";
    this.isTabular = true;
    this.user_role = "9";
    // this.getData(`?date_range=${this.dateRange}`);
    this.selectedOptions = ['Active'];
    this.selectedEmpType = ['ALL', 'C2C', 'C2H', 'FullTime', 'W2'];

    // this.tabularData.forEach(item=>{
    //   if(item.job_date)
    //   item.job_date=  moment(item.job_date).format('MM/DD/YYYY');
    // })

    this.getUserForSelection().subscribe(() => {
      console.log("xAxisFilter: " + this.xAxisFilter);
      console.log("xAxisFilterCountry: " + this.xAxisFilterCountry);

      this.getData(`?date_range=${this.dateRange}`);
      this.filterRecruiterJS(this.xAxisFilter, this.xAxisFilterCountry);
      this.filterOnTableJS(this.xAxisFilter, this.xAxisFilterCountry, this.options, this.empType);
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

    this.filterRecruiterJS(this.xAxisFilter, this.xAxisFilterCountry);
    this.filterOnTableJS(this.xAxisFilter, this.xAxisFilterCountry, this.options, this.empType);
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

  onPageSizeChanged() {

    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
  }
  selectedIndexChange(event) {
    console.log("selectedIndexChange");
    console.log(event);
    this.selected.setValue(event)
    console.log(this.selected);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }
  addTab(selectAfterAdding: boolean) {
    this.tabs.push({
      tabType: this.tabs.length,
      name: 'Main',
      summaryData: 'Main',
      allData: 'Main',
      job_id: "",
      job_title: "",
      bdm: "",
      dataType: 'Summary',
      startDate: this.startDate,
      endDate: this.endDate,
      dateRange: this.dateRange,
      country: this.clientCountry,
      rId: "",
      rName: ""
    });

    // if (selectAfterAdding) {
    //   this.selected.setValue(this.tabs.length - 1);
    // }
  }


  closeTab(index: number) {
    event.stopPropagation();
    // this.closedTabs.push(index);
    this.tabs.splice(index, 1);
    this.tabGroup.selectedIndex = this.tabs.length;
  }
  filterRecruiterJS(bdm: string, country: string): void {
    this.bdmName = bdm;
    this.clientCountry = country;
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





    if (bdm === 'ALL' && (country === 'none' || country === 'ALL')) {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    }

    else if (bdm === 'ALL' && country !== 'none') {
      this.data.forEach(_ => {
        if (_.country === country && _.total_count > 0) {
          jobSummary.add(_.job_title);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else if (bdm !== 'ALL' && country === 'ALL') {
      this.data.forEach(_ => {
        if (_.bdm_name === bdm && _.total_count > 0) {
          jobSummary.add(_.job_title);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else {
      this.data.forEach(_ => {
        if (_.bdm_name === bdm && _.country === country && _.total_count > 0) {
          jobSummary.add(_.job_title);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    // console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }
  selectDataType(dataType, index) {


    this.tabs[index].dataType = dataType;
  }

  onSelectionChanged(data) {
    var selectedRows = this.gridApi.getSelectedRows();
    console.log(selectedRows);
    console.log("selectedRows");
    console.log("data");
    //console.log(data);
    var bdm = this.findBdm(this.xAxisFilter);
    //console.log(bdm)
    var id = (bdm != undefined) ? bdm.bdm_id : null
    // this.router.navigate(['/home/reports/submission-report'], { state: { startDate: this.startDate, endDate: this.endDate, dateRange: this.dateRange, selectedRow: data.data} });
    // this.viewAllSubmissions();


    if(data.colDef.field === "job_title"){
      const queryParams = { job_id: data.data.id, job_title: data.data.job_title, bdm: id, startDate: this.startDate, endDate: this.endDate, dateRange: this.dateRange, country: this.clientCountry };

    const link = this.router.serializeUrl(this.router.createUrlTree(['/home/reports/submission-report'], { queryParams: queryParams, }));
    window.open(link, '_blank');
    }else if(data.colDef.field === "Submission"){
      const queryParams = { job_id: data.data.id, job_title: data.data.job_title, bdm: data.data.bdm_id, startDate: this.startDate, endDate: this.endDate, dateRange: this.dateRange, country: this.clientCountry, client: data.data.client_name};

      const link = this.router.serializeUrl(this.router.createUrlTree(['/home/reports/common-submission-report'], { queryParams: queryParams, }));
      window.open(link, '_blank');
    }
  }

  onSelectionChangedSubmission(data, bdmId, job_id, job_title, dataType) {
    if (dataType !== 'Summary') {
      return;
    }

    var apiParam = `date_range=${this.dateRange}`;
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }


    if (bdmId) {
      apiParam += `&bdm_id=${bdmId}`;
    }

    apiParam += `&job_id=${job_id}&country=${this.clientCountry}&rid=${data.data.rid}`;



    // const request = [
    //   this._api.getCollectionItemById(`/reports/job_summary_table_by_title/?${apiParam}`),];

    // forkJoin(request).subscribe((res: Array<any>) => {


    // }, err => {
    //   console.log(err.message);
    // })

    console.log("apiParam");
    console.log(apiParam);
    forkJoin([
      this._api.getReportWithApiLink(`/reports/get_candidate_detail_by_job_id/?${apiParam}`),

    ])
      .subscribe((res: Array<any>) => {


        var sumData = res[0];

        sumData.forEach(_ => {


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

        this.tabs.push({
          tabType: 2,
          name: data.data.recruiter_name,
          summaryData: sumData,
          allData: "",
          job_id: job_id,
          job_title: job_title,
          bdm: bdmId,
          dataType: 'Summary',
          startDate: this.startDate,
          endDate: this.endDate,
          dateRange: this.dateRange,
          country: this.clientCountry,
          rId: data.data.rid,
          rName: data.data.recruiter_name
        });
        this.tabGroup.selectedIndex = this.tabs.length - 1;
        this.selected.setValue(this.tabGroup.selectedIndex)
      }, error => {
        console.log(error);
      })

  }
  filterOnTableJS(bdmName: string, country: string, empType: string[], status: string[]) {
    this.bdmName = bdmName;
    this.clientCountry = country;
    console.log(this.selectedOptions);
    console.log(this.selectedEmpType);

    if (JSON.stringify(this.selectedOptions.sort()) ===
      JSON.stringify(['Active', 'Inactive', 'Rejected', 'SubmissionNotAccepted', 'RejectedForRate'].sort())) {
      status = ['ALL'];
    }
    else {
      status = this.selectedOptions.slice();
    }

    if (JSON.stringify(this.selectedEmpType.sort()) ===
        JSON.stringify(['C2C', 'C2H', 'FullTime', 'W2'].sort())){
          empType = ['ALL'];
    }
    else{
      empType = this.selectedEmpType.slice();
    }

    console.log("S: " + status);
    console.log("E: " + empType);
    this.tabularDataForFilter = this.tabularData;

    if (bdmName === 'ALL' && (country === 'none' || country === 'ALL') &&
     (empType.includes('none') || empType.includes('ALL')) &&
      (status.includes('ALL') || status.includes('none') || status.includes('Active'))) {
      console.log("In all");
      this.tabularDataForFilter = this.tabularData;
    }
    else if (bdmName === 'ALL' && country !== 'ALL') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("country: " + country);
        if (country === _.client_country) {
          // console.log(_)
          return _;
        }
      })
      if (empType.length === 0 || status.length === 0) {
        return this.tabularDataForFilter = null;
      }
    }
    else if (bdmName !== 'ALL' && country === 'ALL') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("bdm: " + bdmName);
        if (bdmName === _.bdm_name) {
          // console.log(_)
          return _;
        }
      })
      if (empType.length === 0 || status.length === 0) {
        return this.tabularDataForFilter = null;
      }
    }
    else if (bdmName === 'ALL' && country === 'ALL' && !empType.includes('ALL')){
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("EmpT: " + empType);
          return empType.includes(_.job_type);
      })
      if (status.length === 0) {
        return this.tabularDataForFilter = null;
      }
    }
    else if (bdmName === 'ALL' && country === 'ALL' && empType.includes('ALL')) {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("ALL T");
        return status.includes(_.status);
      })
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("else block");
        if (bdmName === _.bdm_name && country === _.client_country) {
          // console.log(_)
          return _;
        }
      })
      if (empType.length === 0 || status.length === 0) {
        return this.tabularDataForFilter = null;
      }
    }

    if (status.length !== 0 && !status.includes('ALL') && empType.length !== 0 && !empType.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Status != none & empT != none");
        return status.includes(_.status) && empType.includes(_.job_type);
      })
    }
    else if (status.length !== 0 && status.includes('ALL') && empType.length !== 0 && !empType.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Status = ALL $ empT != none");
        return empType.includes(_.job_type);
      })
    }
    else if (status.length !== 0 && !status.includes('ALL') && empType.length !== 0 && empType.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Status != ALL & empT = ALL");
        return status.includes(_.status);
      })
    }
    else if (status.length === 0 && !status.includes('ALL') && empType.length !== 0 && empType.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Status = 0 & empT = ALL");
        return null;
      })
    }
    else if (status.length === 0 && !status.includes('ALL') && empType.length !== 0 && !empType.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Status = 0 & empT != ALL");
        return empType.includes(_.job_type);
      })
    }
    else if (status.length !== 0 && status.includes('ALL') && empType.length === 0 && !empType.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Status = ALL & empT = 0");
        return null;
      })
    }
    else if (status.length !== 0 && !status.includes('ALL') && empType.length === 0 && !empType.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Status != ALL & empT = 0");
        return status.includes(_.status);
      })
    }
  }

  filterOnTableJSCheckbox(bdmName: string, country: string, status: string[], emptype: string[]) {
    console.log("vishnu");
    console.log(this.tabularData);
    this.bdmName = bdmName;
    this.clientCountry = country;
    this.tabularDataForFilter = this.tabularData;
    console.log(status[0]);
    console.log("status data");
    console.log(emptype[0]);
    console.log("emptype");
    if(emptype.includes('ALL')) {
      emptype = ['C2C', 'C2H', 'FullTime', 'W2'];
    }
    if (bdmName === 'ALL' && (country === 'none' || country === 'ALL') && (status.includes('ALL')) && (emptype.includes('ALL'))) {
      this.selectedOptions.length = 0;
      this.tabularDataForFilter = this.tabularData;
    }
    else if (bdmName === 'ALL' && (country === 'none' || country === 'ALL') && status.length !== 0 && !status.includes('ALL') && (emptype.includes('ALL'))) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(item => status.includes(item.status));
    }
    else if (bdmName === 'ALL' && (country === 'none' || country === 'ALL') && status.length === 0 && emptype.length !== 0 && !emptype.includes('ALL')) {
      // this.tabularDataForFilter = this.tabularDataForFilter.filter(item => emptype.includes(item.job_type));
      this.tabularDataForFilter = null;
    }
    else if (bdmName === 'ALL' && (country === 'none' || country === 'ALL') && emptype.length !== 0 && !emptype.includes('ALL') && status.length !== 0 && !status.includes('ALL')) {
      console.log('line number')
      this.tabularDataForFilter = this.tabularDataForFilter.filter(item => emptype.includes(item.job_type) && status.includes(item.status));
    }else if (bdmName === 'ALL' && (country === 'none' || country === 'ALL') && emptype.length !== 0 && !emptype.includes('ALL') && status.length !== 0 && status.includes('ALL')) {
      console.log('line number639')
      this.selectedOptions.length = 0;
      this.tabularDataForFilter = this.tabularDataForFilter.filter(item => emptype.includes(item.job_type));
    }

    else if (bdmName === 'ALL' && country !== 'none') {
      if(status.length === 0 && emptype.length !== 0 && !emptype.includes('ALL')){
        // this.tabularDataForFilter = this.tabularData.filter(_ => country === _.client_country && emptype.includes(_.job_type))
        this.tabularDataForFilter = null;
      }else if(status.length !== 0 && emptype.length === 0 && !status.includes('ALL')){
        // this.tabularDataForFilter = this.tabularData.filter(_ => country === _.client_country && status.includes(_.status))
        this.tabularDataForFilter = null;
      }
      else if(status.length !== 0 && emptype.length !== 0 && !emptype.includes('ALL') && !status.includes('ALL')){
        this.tabularDataForFilter = this.tabularData.filter(_ => country === _.client_country && emptype.includes(_.job_type) && status.includes(_.status))
      }
      else if(status.length !== 0 && emptype.length !== 0 && !emptype.includes('ALL') && status.includes('ALL')){
        this.selectedOptions.length = 0;
        this.tabularDataForFilter = this.tabularData.filter(_ => country === _.client_country && emptype.includes(_.job_type))
      }
      else{
        this.selectedOptions.length = 0;
        this.selectedEmpType.length = 0;
        this.tabularDataForFilter = this.tabularData.filter(_ => {
          if (country === _.client_country) {
            // console.log(_)
            return null;
          }
        })
      }
    }
    else if (bdmName !== 'ALL' && country === 'ALL' ) {
      if(emptype.length !==0 && !emptype.includes('ALL') && status.length !== 0 && !status.includes('ALL')){
        this.tabularDataForFilter = this.tabularDataForFilter.filter(item => status.includes(item.status) && emptype.includes(item.job_type) && item.bdm_name === bdmName);
      }else if(emptype.length ===0 && status.length !== 0 && !status.includes('ALL')){
          // this.tabularDataForFilter = this.tabularDataForFilter.filter(item => status.includes(item.status) && item.bdm_name === bdmName);
          this.tabularDataForFilter = null;
      }else if(emptype.length !==0 && !emptype.includes('ALL') && status.length === 0){
          // this.tabularDataForFilter = this.tabularDataForFilter.filter(item => emptype.includes(item.job_type) && item.bdm_name === bdmName);
          this.tabularDataForFilter = null;
      }else if(status.length !==0 && status.includes('ALL') && emptype.length !== 0 && !emptype.includes('ALL')){
        this.selectedOptions.length = 0;
        this.tabularDataForFilter = this.tabularDataForFilter.filter(item => emptype.includes(item.job_type) && item.bdm_name === bdmName);
      }else{
        this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
          if (bdmName === _.bdm_name) {
            // console.log(_)
            return null;
          }
        })
      }
      return this.tabularDataForFilter;
    }
    else {
      if(emptype.length !== 0 && !emptype.includes('ALL') && status.length !== 0 && !status.includes('ALL')){
        this.tabularDataForFilter = this.tabularData.filter(_ => bdmName === _.bdm_name && country === _.client_country && status.includes(_.status) && emptype.includes(_.job_type))
      }else if(emptype.length !== 0 && !emptype.includes('ALL') && status.length === 0){
        // this.tabularDataForFilter = this.tabularData.filter(_ => bdmName === _.bdm_name && country === _.client_country && emptype.includes(_.job_type))
        this.tabularDataForFilter = null;
      }else if(emptype.length === 0 && status.length !== 0 && !status.includes('ALL')){
        // this.tabularDataForFilter = this.tabularData.filter(_ => bdmName === _.bdm_name && country === _.client_country && status.includes(_.status))
        this.tabularDataForFilter = null;
      }else if(emptype.includes('ALL') && status.length !== 0 && !status.includes('ALL')){
        this.selectedEmpType = ['C2C', 'C2H', 'FullTime','W2'];
        this.tabularDataForFilter = this.tabularData.filter(_ => bdmName === _.bdm_name && country === _.client_country && status.includes(_.status))
      }else if(emptype.length !== 0 && !emptype.includes('ALL') && status.length !== 0 && status.includes('ALL')){
        this.selectedOptions = ['Active', 'Inactive', 'Rejected',
        'SubmissionNotAccepted','RejectedForRate'];
        this.tabularDataForFilter = this.tabularData.filter(_ => bdmName === _.bdm_name && country === _.client_country && emptype.includes(_.job_type))
      }else{
        this.selectedOptions.length = 0;
        this.selectedEmpType.length = 0;
        this.tabularDataForFilter = this.tabularData.filter(_ => {
          if (bdmName === _.bdm_name && country === _.client_country) {
            // console.log(_)
            return null;
          }
        })
      }
    }

    // const filteredData = this.tabularDataForFilter.filter(item => status.includes(item.status));
    console.log(status[0]);
  console.log("filter data");

  }

  clientNameClick(params) {
    console.log("params");
  }

  columnDefs = [
    {
      headerName: "Client Name", field: "client_name", sortable: true, filter: true, pinned: 'left'
    },
    //
    { headerName: "Job Title", field: "job_title", sortable: true, filter: true, pinned: 'left' },
    { headerName: "Posted Date", sort: 'asc', field: "job_date", sortable: true, filter: true, pinned: 'left',
    filterParams: {
      debounceMs: 500,
      suppressAndOrCondition: true,
      comparator: function(filterLocalDateAtMidnight, cellValue) {
        if (cellValue == null) {
          return 0;
        }
        var dateParts = cellValue.split('/');
        var year = Number(dateParts[2]);
        var month = Number(dateParts[1]) - 1;
        var day = Number(dateParts[0]);
        var cellDate = new Date(year, month, day);

        if (cellDate < filterLocalDateAtMidnight) {
          return -1;
        } else if (cellDate > filterLocalDateAtMidnight) {
          return 1;
        } else {
          return 0;
        }
      },
    },

  },
    { headerName: "Total Openings", field: "number_of_opening", sortable: true, filter: true },
    {
      headerName: "Submission", field: "Submission", sortable: true, filter: true,
      cellStyle: function (params) {

        if (params.data.StillSubmission > "0" && params.data.StillSubmission !== "--") {

          return { color: 'red' };
        } else {
          return null;
        }
      }
    },
    // { headerName: "Status Still Submission", field: "StillSubmission", sortable: true, filter: true },
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
    {
      headerName: "Send Out", field: "SendOut", sortable: true, filter: true,
      cellStyle: function (params) {
        var sendOutVerify = 0;

        if (params.data.SendoutReject !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.SendoutReject);
        } else if (params.data.ClientInterviewFirst !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.ClientInterviewFirst);
        } else if (params.data.InterviewBackout !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.InterviewBackout);
        } else if (params.data.InterviewReject !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.InterviewReject);
        } else if (params.data.InterviewSelect !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.InterviewSelect);
        } else if (params.data.ClientInterviewSecond !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.ClientInterviewSecond);
        } else if (params.data.SecondInterviewReject !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.SecondInterviewReject);
        } else if (params.data.Offered !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.Offered);
        } else if (params.data.OfferRejected !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.OfferRejected);
        } else if (params.data.OfferBackout !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.OfferBackout);
        } else if (params.data.FeedbackAwaited !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.FeedbackAwaited);
        } else if (params.data.HoldbyClient !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.HoldbyClient);
        } else if (params.data.Placed !== "--") {
          sendOutVerify = sendOutVerify + Number(params.data.Placed);
        }

        if (params.data.SendOut > sendOutVerify) {

          return { color: 'blue' };
        } else {
          return null;
        }
      }
    },
    { headerName: "Send Out Rejected", field: "SendoutReject", sortable: true, filter: true },
    {
      headerName: "Client Interview", field: "ClientInterview", sortable: true, filter: true,
      cellStyle: function (params) {
        var clientInterviewVerify = 0;

        if (params.data.ClientInterviewFirst !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.ClientInterviewFirst);
        } else if (params.data.InterviewReject !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.InterviewReject);
        } else if (params.data.InterviewBackout !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.InterviewBackout);
        } else if (params.data.InterviewSelect !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.InterviewSelect);
        } else if (params.data.ClientInterviewSecond !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.ClientInterviewSecond);
        } else if (params.data.SecondInterviewReject !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.SecondInterviewReject);
        } else if (params.data.Offered !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.Offered);
        } else if (params.data.OfferRejected !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.OfferRejected);
        } else if (params.data.OfferBackout !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.OfferBackout);
        } else if (params.data.FeedbackAwaited !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.FeedbackAwaited);
        } else if (params.data.HoldbyClient !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.HoldbyClient);
        } else if (params.data.Placed !== "--") {
          clientInterviewVerify = clientInterviewVerify + Number(params.data.Placed);
        }

        console.log(clientInterviewVerify);
        console.log(params.data.ClientInterview);

        if (params.data.ClientInterview > clientInterviewVerify) {

          return { color: '#d20cd4' };
        } else {
          return null;
        }
      }
    },
    { headerName: "Holdby Client", field: "HoldbyClient", sortable: true, filter: true },
    { headerName: "Interview Backout", field: "InterviewBackout", sortable: true, filter: true },
    { headerName: "Interview Reject", field: "InterviewReject", sortable: true, filter: true },
    { headerName: "Feedback Awaited", field: "FeedbackAwaited", sortable: true, filter: true },
    { headerName: "Shortlisted", field: "Shortlisted", sortable: true, filter: true },
    { headerName: "Offered", field: "Offered", sortable: true, filter: true },
    { headerName: "Offer Rejected", field: "OfferRejected", sortable: true, filter: true },
    { headerName: "Offer Backout", field: "OfferBackout", sortable: true, filter: true },
    { headerName: "Placed", field: "Placed", sortable: true, filter: true },

    // { headerName: "Remarks", field: "remarks", sortable: true, filter: true },

    // // { headerName: "Second Interview Reject", field: "SecondInterviewReject", sortable: true, filter: true },
    // { headerName: "Rejected By Team", field: "RejectedByTeam", sortable: true, filter: true },
    // // { headerName: "Client Interview First", field: "ClientInterviewFirst", sortable: true, filter: true },
    // { headerName: "Interview Select", field: "InterviewSelect", sortable: true, filter: true },

    // { headerName: "Internal Interview", field: "InternalInterview1", sortable: true, filter: true },
    // { headerName: "Internal Interview Reject", field: "InternalInterviewReject1", sortable: true, filter: true },





    // { headerName: "Interview Reject", field: "InterviewReject", sortable: true, filter: true },
    { headerName: "BDM Name", field: "bdm_name", sortable: true, filter: true },
    { headerName: "Employment Type", field: "job_type", sortable: true, filter: true },
    { headerName: "Job Status", field: "status", sortable: true, filter: true },
    { headerName: "Min Salary($)", field: "min_salary", sortable: true, filter: true },
    { headerName: "Max Salary($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Min Rate($)", field: "min_rate", sortable: true, filter: true },
    { headerName: "Max Rate($)", field: "max_rate", sortable: true, filter: true },
    { headerName: "Client Country", field: "client_country", sortable: true, filter: true },


  ];

  columnDefsSum = [
    {
      headerName: "Date", field: "job_posted_date", sortable: true, filter: true,


    },

    { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true },
    { headerName: "Submission", field: "Submission", sortable: true, filter: true },
    { headerName: "Submission Rejected", field: "SubmissionReject", sortable: true, filter: true },
    { headerName: "SendOut", field: "SendOut", sortable: true, filter: true },
    { headerName: "SendOut Rejected", field: "SendoutReject", sortable: true, filter: true },
    // { headerName: "Candidate Added", field: "CandidateAdded", sortable: true, filter: true },
    { headerName: "Interview", field: "ClientInterview", sortable: true, filter: true },
    { headerName: "Interview Rejected", field: "RejectedByClient", sortable: true, filter: true },
    { headerName: "Shortlisted", field: "Shortlisted", sortable: true, filter: true },
    { headerName: "Offered", field: "Offered", sortable: true, filter: true },
    { headerName: "Offer Rejected", field: "OfferRejected", sortable: true, filter: true },
    { headerName: "Placed", field: "Placed", sortable: true, filter: true },
    // { headerName: "Client Interview Second", field: "ClientInterviewSecond", sortable: true, filter: true },
    // { headerName: "Second Interview Reject", field: "SecondInterviewReject", sortable: true, filter: true },
    { headerName: "Internal Interview", field: "InternalInterview", sortable: true, filter: true },
    { headerName: "Internal Interview Reject", field: "InternalInterviewReject", sortable: true, filter: true },
    { headerName: "Rejected By Team", field: "RejectedByTeam", sortable: true, filter: true },
    { headerName: "Feedback Awaited", field: "FeedbackAwaited", sortable: true, filter: true },
    { headerName: "Client Interview First", field: "ClientInterviewFirst", sortable: true, filter: true },
    { headerName: "Offer Backout", field: "OfferBackout", sortable: true, filter: true },
    { headerName: "Candidate Review", field: "CandidateReview", sortable: true, filter: true },
    { headerName: "Holdby BDM", field: "HoldbyBDM", sortable: true, filter: true },
    { headerName: "Holdby Client", field: "HoldbyClient", sortable: true, filter: true },
    { headerName: "Interview Backout", field: "InterviewBackout", sortable: true, filter: true },
    { headerName: "Interview Select", field: "InterviewSelect", sortable: true, filter: true },
    { headerName: "Interview Reject", field: "InterviewReject", sortable: true, filter: true },
    { headerName: "BDM Name", field: "bdm_name", sortable: true, filter: true },
    { headerName: "Employment Type", field: "job_type", sortable: true, filter: true },
    { headerName: "Min Salary($)", field: "min_salary", sortable: true, filter: true },
    { headerName: "Max Salary($)", field: "max_salary", sortable: true, filter: true },
    { headerName: "Min Rate($)", field: "min_rate", sortable: true, filter: true },
    { headerName: "Max Rate($)", field: "max_rate", sortable: true, filter: true },



  ];



  columnDefsAllData = [
    {
      headerName: "Submission Date", field: "submission_date", sortable: true, filter: true, flex: 2,
    },
    { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true, flex: 2, },
    { headerName: "Candidate Name", field: "candidate_name", sortable: true, filter: true, flex: 2, },
    { headerName: "Current Status", field: "current_status", sortable: true, filter: true, flex: 2, },

  ];

  columnDefsSUMREQ = [
    { headerName: "Submission Date", field: "submission_date", sortable: true, filter: true },
    { headerName: "Status", field: "status", sortable: true, filter: true },
    { headerName: "Candidate Name", field: "candidate_name", sortable: true, filter: true },
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
    { headerName: "Client Name", field: "client_name", sortable: true, filter: true },

  ];

  viewAllSubmissions() {

    var apiParam = `date_range=${this.dateRange}`;
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }

    // this._api.getReportWithApiLink(`/reports/job_summary_table_by_title/?${apiParam}`).subscribe(_ => {
    //   const modalRef = this.modalService.open(SubmissionDetailsComponent, {
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


  downloadCsvFileCandidate(bdmId, job_id, rId): void {
    var apiParam = `date_range=${this.dateRange}`;
    var fileName = 'job_submission_candidate_report'
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }

    if (bdmId) {
      apiParam += `&bdm_id=${bdmId}`;
    }

    apiParam += `&job_id=${job_id}&country=${this.clientCountry}&rid=${rId}`;
    var csv_api = `/reports/get_candidate_detail_by_job_id_csv/?${apiParam}`;


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

  downloadCsvFile(bdmId, job_id, dataType): void {
    var apiParam = `date_range=${this.dateRange}`;
    var fileName = 'job_submission_summary'
    if (this.dateRange == ReportDateRange.CUSTOM) {

      apiParam = `start_date=${this.startDate}&end_date=${this.endDate}`;
    }

    if (bdmId) {
      apiParam += `&bdm_id=${bdmId}`;
    }

    apiParam += `&job_id=${job_id}&country=${this.clientCountry}`;
    var csv_api;
    if (dataType === "Summary") {
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

  handleOptionChange(event: any, option: string) {
    console.log(event);
    if (event.target.checked) {
      if(option === "ALL"){
        this.selectedOptions = ['Active', 'Inactive', 'Rejected',
        'SubmissionNotAccepted','RejectedForRate'];
      }else{
        this.selectedOptions.push(option);
      }
      // if(option === 'ALL'){
      //   event.target.checked = false;
      // }
    } else {
      if(option === "ALL"){
        this.selectedOptions = [];
      }
      const index = this.selectedOptions.indexOf(option);
      if (index !== -1) {
        this.selectedOptions.splice(index, 1);
      }
    }
    if (this.selectedOptions.length === 0) {
      this.optionButtonText = 'Select Job Status';
    } else {
      this.optionButtonText = this.selectedOptions.join(', ');
    }
    console.log(this.selectedOptions);
    // this.filterOnTableJSCheckbox(this.xAxisFilter, this.xAxisFilterCountry, this.selectedOptions, this.selectedEmpType);
    // this.filterRecruiterJS(this.xAxisFilter, this.xAxisFilterCountry);
  }

  handleEmpTypeChange(event: any, emptype: string) {
    console.log(event);
    if (event.target.checked) {
      if(emptype === "ALL"){
        this.selectedEmpType = ['C2C', 'C2H', 'FullTime', 'W2'];
      }else{
        this.selectedEmpType.push(emptype);
      }
    } else {
      if(emptype === "ALL"){
        this.selectedEmpType = [];
      }
      const index = this.selectedEmpType.indexOf(emptype);
      if (index !== -1) {
        this.selectedEmpType.splice(index, 1);
      }
    }
    if (this.selectedEmpType.length === 0) {
      this.employeeButtonText = 'Employement Type';
    } else {
      this.employeeButtonText = this.selectedEmpType.join(', ');
    }

    // this.filterOnTableJSCheckbox(this.xAxisFilter, this.xAxisFilterCountry, this.selectedOptions, this.selectedEmpType);
    // this.filterRecruiterJS(this.xAxisFilter, this.xAxisFilterCountry);
  }
}



// "sum(case when s.stage_name = 'Candidate Added' then 1 else 0 end) as CandidateAdded, " \
// "sum(case when s.stage_name = 'Candidate Review' then 1 else 0 end) as CandidateReview, " \
// "sum(case when s.stage_name = 'Rejected By Team' then 1 else 0 end) as RejectedByTeam, " \
//

// "sum(case when (s.stage_name = 'Submission' OR s.stage_name = 'Submission Reject'
// OR s.stage_name = 'Internal Interview' OR s.stage_name = 'Internal Interview Reject'
// OR s.stage_name = 'Candidate Review' OR s.stage_name = 'SendOut' OR s.stage_name = 'SendOut Reject'
// OR s.stage_name = 'Client Interview First' OR s.stage_name = 'Interview Backout Interview Reject'
// OR s.stage_name = 'Interview Select' OR s.stage_name = 'Client Interview - Second' OR s.stage_name = 'Second Interview Reject'
// OR s.stage_name = 'Offerred' OR s.stage_name = 'Offer Reject' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Feedback Awaited'
// OR s.stage_name = 'Hold by BDM' OR s.stage_name = 'Hold by Client' OR s.stage_name = 'Placed' OR s.stage_name = 'Interview Reject')
// then 1 else 0 end) as Submission, " \


// "sum(case when s.stage_name = 'Submission' then 1 else 0 end) as StillSubmission," \
// "sum(case when s.stage_name = 'Submission Reject' then 1 else 0 end) as SubmissionReject," \
// "sum(case when (s.stage_name = 'SendOut' OR s.stage_name = 'SendOut Reject' OR s.stage_name = " \
// "'Client Interview - First' OR s.stage_name = 'Interview Backout' OR s.stage_name = 'Interview " \
// "Reject' OR s.stage_name = 'Interview Select' OR s.stage_name = 'Client Interview - Second' OR " \
// "s.stage_name = 'Second Interview Reject' OR s.stage_name = 'Offerred' OR s.stage_name = 'Offer " \
// "Reject' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Feedback Awaited' OR s.stage_name = " \
// "'Hold by Client' OR s.stage_name = 'Placed' ) then 1 else 0 end) as 'SendOut'," \
// "sum(case when s.stage_name = 'Sendout Reject' then 1 else 0 end) as SendoutReject ," \
// "sum(case when (s.stage_name = 'Client Interview - First' OR s.stage_name = 'Interview Backout' OR s.stage_name = 'Interview Reject' OR s.stage_name = 'Interview Select' OR s.stage_name = 'Client Interview - Second' OR s.stage_name = 'Second Interview Reject' OR s.stage_name = 'Offerred' OR s.stage_name = 'Offer Reject' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Feedback Awaited' OR s.stage_name = 'Hold by Client' OR s.stage_name = 'Placed' ) then 1 else 0 end) as ClientInterview ," \
// "sum(case when s.stage_name = 'Interview Reject' then 1 else 0 end) as 'RejectedByClient'," \
// "sum(case when (s.stage_name = 'Offerred' OR s.stage_name = 'Offer Rejected' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Placed') then 1 else 0 end) as Offered ," \
// "sum(case when (s.stage_name = 'Shortlisted' OR s.stage_name = 'Offered' OR s.stage_name = 'Offer Rejected' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Placed') then 1 else 0 end) as Shortlisted," \
// "sum(case when (s.stage_name = 'Client Interview - First' OR s.stage_name = 'Hold by Client' OR s.stage_name = 'Interview Backout' OR s.stage_name = 'Feedback Awaited' OR s.stage_name = 'Interview Reject' OR s.stage_name = 'Interview Select' OR s.stage_name = 'Client Interview - Second' OR s.stage_name = 'Second Interview Reject' OR s.stage_name = 'Shortlisted' OR s.stage_name = 'Offered' OR s.stage_name = 'Offer Rejected' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Placed' ) then 1 else 0 end) as ClientInterviewFirst," \
// "sum(case when (s.stage_name = 'Client Interview - Second' OR s.stage_name = 'Second Interview Reject' OR s.stage_name = 'Shortlisted' OR s.stage_name = 'Offered' OR s.stage_name = 'Offer Rejected' OR s.stage_name = 'Offer Backout' OR s.stage_name = 'Placed' ) then 1 else 0 end) as ClientInterviewSecond," \
// "sum(case when s.stage_name = 'Offer Rejected' then 1 else 0 end) as OfferRejected," \
// "sum(case when s.stage_name = 'Second Interview Reject' then 1 else 0 end) as SecondInterviewReject ," \
// "sum(case when s.stage_name = 'Hold by Client' then 1 else 0 end) as HoldbyClient," \
// "sum(case when s.stage_name = 'Interview Select' then 1 else 0 end) as InterviewSelect ," \
// "sum(case when s.stage_name = 'Offer Backout' then 1 else 0 end) as OfferBackout," \
// "sum(case when s.stage_name = 'Hold by BDM' then 1 else 0 end) as HoldbyBDM," \
// "sum(case when s.stage_name = 'Internal Interview' then 1 else 0 end) as InternalInterview," \
// "sum(case when s.stage_name = 'Interview Backout' then 1 else 0 end) as InterviewBackout," \
// "sum(case when s.stage_name = 'Feedback Awaited' then 1 else 0 end) as FeedbackAwaited," \
// "sum(case when s.stage_name = 'Internal Interview Reject' then 1 else 0 end) as InternalInterviewReject," \
// "sum(case when s.stage_name = 'Placed' then 1 else 0 end) as Placed," \
// "sum(case when s.stage_name = 'Interview Reject' then 1 else 0 end) as InterviewReject "
// ::ng-deep .mat-tab-list .mat-tab-labels:first-child div{

//   border-radius: .25rem .25rem 0px 0px;
// }
// ::ng-deep .mat-tab-list .mat-tab-labels .mat-tab-label-active {
//   color: white;
//   background-color: #26ae61;
// }

// ::ng-deep .mat-tab-label {
//   color: #000000;
//   background-color: #ffffff;
//   border-color: coral;
//   border-width: 1px;
// }

// ::ng-deep .mat-tab-label:selected{
//   color: white;
//   background-color: #26ae61;
// }


// ::ng-deep.mat-tab-label.mat-tab-label-active:not(.mat-tab-disabled),
// ::ng-deep.mat-tab-label.mat-tab-label-active.cdk-keyboard-focused:not(.mat-tab-disabled) {
// background-color: #26ae61;
// font-weight: 700;
// color: white;
// opacity: 1;
// }
