import { Directive, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConsoleService } from '@ng-select/ng-select/lib/console.service';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import * as moment from 'moment';
import { Label } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { ChartTypeEnum, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { CandidateDetailsComponent } from '../candidate-details/candidate-details.component';
import { DateRangePickerComponent } from '../date-range-picker/date-range-picker.component';

@Directive()
export class BaseReportComponent<T> implements OnInit {

  public tag: string;
  public graph_api: string;
  public table_api: string;
  public csv_api: string;
  public label_name: string;
  public user_role: string;
  public chartOptions: (ChartOptions & { annotation: any });
  public user_api: string = "/users/get_users_by_role/?user_role=";
  // public chartOptions: (ChartOptions & { annotation: any }) = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   annotation: true,
  //   elements: {
  //     line: {
  //       tension: 0
  //     }
  //   },
  //   scales: {
  //     xAxes: [{
  //       gridLines: {
  //         color: "rgba(0, 0, 0, 0)",
  //       },
  //       offset: true,
  //     }],
  //     yAxes: [{
  //       gridLines: {
  //         // color: "rgba(0, 0, 0, 0)",
  //       },
  //       ticks: {
  //         beginAtZero: true,
  //       }
  //     }]
  //   },
  // };



  public colors = [
    '239, 83, 80',
    '38, 198, 218',
    '255, 183, 77',
    '236, 64, 122',
    '77, 182, 172',
    '255, 138, 101',
    '171, 71, 188',
    '129, 199, 132',
    '161, 136, 127',
    '92, 107, 192',
    '220, 231, 117',
    '224, 224, 224',
    '66, 165, 245',
    '255, 241, 118',
    '144, 164, 174'
  ];

  public chartData: CustomizedDataSet[] = [];
  // public chartData: ChartDataSets[] = [];
  public selectedOptions: string[] = [];
  public selectedEmpType: string[] = [];
  public chartType: ChartType = ChartTypeEnum.BAR;
  public chartLabels: Label[] = [];
  public ChartTypeEnum = ChartTypeEnum;
  public isCompleted: boolean = false;
  public xAxisFilter: string = 'none';
  public xAxisFilterBDM: string = 'none';
  public xAxisFilterCountry: string = 'none';
  public xAxisFilterJobStatus: string[] = [];
  public xAxisFilterEmpType: string[] = [];
  public xAxisFilterArray: Array<string> = [];
  public xAxisCountryFilterArray: any;
  public allStages: Array<string> = [];
  public allStagesDummy: Array<string> = [];
  public clientRevenue: Array<string> = [];
  public isTabular: boolean = false;
  public tabularData: Array<any>;
  public allUsers: Array<any>;
  setBDMS = new Set<String>();
  public allBDMS: Array<any>;
  public tabularDataForFilter: Array<any>;
  public rowData: any;
  public allDateRange = ReportDateRange;
  public dateRange = ReportDateRange.MONTH;
  public dateRangeToday = ReportDateRange.TODAY;
  public dateRangeSelected = ReportDateRange.TODAY;
  public dateRangeResult: any;
  public dateRangeKeys = Object.keys(this.allDateRange);
  public startDate: string = moment(new Date()).format('YYYY-MM-DD');;
  public endDate: string = moment(new Date()).format('YYYY-MM-DD');;
  public data: any;
  setForJobSummary = new Set<String>();
  setForJobSummaryCountry = new Set<String>();
  setForBDMJobs = new Set<String>();
  setForJobAging = new Set<String>();
  setForClientName = new Set<String>();
  setForJobsByClient = new Set<String>();

  bdmName: string = 'none';
  clientCountry: string = 'none';
  clientName: string = 'ALL'
  pageToBeLoaded = "report"
  constructor(
    protected _api: APIProviderService<T>,
    protected modal: NgbModal,
  ) { }

  ngOnInit(): void {

    console.log("base ngOnInit");
  }


  ngAfterViewInit() {
    let $this = this;

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      annotation: true,
      elements: {
        line: {
          tension: 0
        }
      },
      scales: {
        xAxes: [{
          gridLines: {
            color: "rgba(0, 0, 0, 0)",
          },
          offset: true,
        }],
        yAxes: [{
          gridLines: {
            // color: "rgba(0, 0, 0, 0)",
          },
          ticks: {

            beginAtZero: true,
          }
        }]
      },
      onClick: function (e) {
        var element = this.getElementAtEvent(e);
        // console.log(element)
        if (element.length) {
          //var datasetLabel=element[0]._model.datasetLabel;
          //var label=element[0]._model.label;
          var _datasetIndex = element[0]._datasetIndex;
          var _index = element[0]._index;
          var label = element[0]._chart.tooltip._data.labels[_index];
          var datasetLabel = element[0]._chart.tooltip._data.datasets[_datasetIndex].label;
          var id;
          var dateForMoreThan30days;
          var dataset: Array<any> = element[0]._chart.tooltip._data.datasets[_datasetIndex].wholeDataSet;
          // console.log(dataset);
          var tag = element[0]._chart.tooltip._data.datasets[_datasetIndex].tag;
          if (tag === ReportTags.BDM || tag === ReportTags.RECRUITER ||
             tag === ReportTags.RECRUITER_PERFORMANCE || tag === ReportTags.CANDIDATE_REPORT)
            dataset.filter(item => {
              if (item.first_name == label)
                id = item.created_by_id;
            })
          else
            if (tag === ReportTags.JOB_SUMMARY) {
              dataset.filter(item => {
                if (item.job_title == label)
                  id = item.job_id;
              })
            }
            else
              if (tag === ReportTags.BDM_JOBS) {
                var diffdays = $this.getDays($this.startDate, $this.endDate);
                console.log(diffdays)
                if ($this.dateRange === ReportDateRange.CUSTOM && diffdays > 30) {
                  dataset.filter(item => {
                    if (item.month === label.split(" ")[0]) {
                      id = item.bdm_id;
                      dateForMoreThan30days = item.created_at;
                      console.log(id);
                    }
                  })
                }
                else {
                  dataset.filter(item => {
                    if (item.created_at.split(" ")[0] == label)
                      id = item.bdm_id;
                    console.log(id);
                  })
                }
              }
          console.log("***tag*** " + tag);
          if (id !== undefined && datasetLabel !== undefined) {
            $this.getAPISegment(id, datasetLabel, tag, label, dateForMoreThan30days)
          }
        }
      },
    };
  }

  protected getData(apiParams: string): void {
    this.setForJobSummary = new Set();
    this.setForJobSummaryCountry = new Set();
    this.setForBDMJobs = new Set();
    this.setForJobAging = new Set();
    this.setForClientName = new Set();
    this.setForJobsByClient = new Set();

    //console.log(`${this.graph_api}${apiParams}`)
    forkJoin([
      this._api.getReportWithApiLink(`${this.graph_api}${apiParams}`),
      this._api.getReportWithApiLink(`${this.table_api}${apiParams}`),
      // this._api.getReportWithApiLink(`${this.user_api}${this.user_role}`)
    ])
      .subscribe((res: Array<any>) => {
        this.getStatus(res[0]);
        this.tabularData = res[1];
        // this.allUsers = res[2];
        // this.allUsers.forEach(_ => {
        //   this.setForJobSummary.add(_.bdm_name);
        // })
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
          if (this.tag === ReportTags.JOB_SUMMARY || this.tag === ReportTags.BDM) {
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
            console.log("client: " + _.client_name_value);
          }
          if (this.tag === ReportTags.JOBS_BY_CLIENT) {
            this.setForJobsByClient.add(_.client_name);
          }
          if (this.tag === ReportTags.RECRUITER || this.tag === ReportTags.RECRUITER_PERFORMANCE ||
             this.tag === ReportTags.JOBS_BY_CLIENT || this.tag === ReportTags.CANDIDATE_REPORT) {
            if (_.country !== "--") {
              this.setForJobSummaryCountry.add(_.country);
            }
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

        console.log("bdmn: " + this.bdmName);

        if (this.tag === "job_summary") {
          this.filterOnTableBdm(this.bdmName, this.clientCountry, this.selectedOptions, this.selectedEmpType);
          this.filterRecruiterJS(this.bdmName, this.clientCountry);
        } else if (this.tag === "recruiter" || this.tag === "candidate_report") {
          this.filterOnTableRecruiter(this.bdmName, this.clientCountry);
          this.filterRecruiterRS(this.bdmName, this.clientCountry);
        }
        else if (this.tag === "jobs_by_client") {
          this.filterOnTableJBCLIENTB(this.xAxisFilter, this.xAxisFilterBDM, this.clientCountry);
          this.filterJobsByClientClient(this.xAxisFilter, this.xAxisFilterBDM, this.clientCountry);
        }
        if (this.tag === "bdm") {
          this.filterRecruiterBC(this.bdmName, this.clientCountry);
          this.filterOnTableBC(this.bdmName, this.clientCountry);
        }
        else if (this.tag === "bdm_job") {
          this.filterRecruiterBdmJobs(this.bdmName);
          this.filterOnTableBdmJobs(this.bdmName);
        }
        else if (this.tag === "job_aging") {
          this.filterRecruiterJobAging(this.bdmName);
          this.filterOnTableJobAging(this.bdmName);
        }
        // this.xAxisFilter = 'ALL'
        // this.bdmName = 'ALL'
        // this.clientName = 'ALL'
        console.log(this.xAxisCountryFilterArray);
      }, error => {
        console.log(error);
      })
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

  filterRecruiterRS(recruiter: string, country: string): void {
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


  filterClient(client: string, country: string): void {
    this.clientName = client;
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





    if (client === 'ALL' && (country === 'none' || country === 'ALL')) {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    }

    else if (client === 'ALL' && country !== 'none') {
      this.data.forEach(_ => {
        if (_.country === country && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else if (client !== 'ALL' && country === 'ALL') {
      this.data.forEach(_ => {
        if (_.company_name === client && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else {
      this.data.forEach(_ => {
        if (_.company_name === client && _.country === country && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    // console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }




  filterJobsByClientClient(client: string, bdm: string, country: string): void {
    console.log("bdm g: " + bdm);
    console.log("client g: " + client);
    console.log("country g: " + country);

    this.clientName = client;
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





    if (client === 'ALL' && (country === 'none' || country === 'ALL') && (bdm === 'none' || bdm === 'ALL')) {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    }

    else if (client === 'ALL' && country !== 'none' && bdm === 'ALL') {
      this.data.forEach(_ => {
        if (_.country === country && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }

    else if (client === 'ALL' && country === 'ALL' && bdm !== 'none') {
      this.data.forEach(_ => {
        if (_.bdm_name === bdm && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }

    else if (client !== 'none' && (country !== 'none' && country !== 'ALL') && bdm === 'ALL') {
      this.data.forEach(_ => {
        if (_.country === country && _.company_name === client && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }

    else if (client !== 'none' && country === 'ALL' && bdm === 'ALL') {
      console.log("client in graph:" + client);
      this.data.forEach(_ => {
        if (_.company_name === client && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    else if (client === 'ALL' && country !== 'none' && bdm !== 'none') {
      this.data.forEach(_ => {
        if (_.country === country && _.bdm_name === bdm && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }

    else if (client !== 'none' && country === 'ALL' && bdm !== 'none') {
      this.data.forEach(_ => {
        if (_.company_name === client && _.bdm_name === bdm && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }

    else {
      console.log("graph else");
      this.data.forEach(_ => {
        if (_.company_name === client && _.country === country && _.bdm_name === bdm && _.total_count > 0) {
          jobSummary.add(_.company_name);
        }
      });
      this.chartLabels = Array.from(jobSummary) as Array<string>;
    }
    // console.log(this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }
  filterOnTableCRLTR(recruiter: string, country: string) {
    this.clientName = recruiter;
    this.clientCountry = country;

    console.log("filterOnTableCRLTR");
    console.log(recruiter);
    console.log(country);
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
        if (_.client_name === recruiter) {
          // console.log(_)
          return _;
        }
      })
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (_.client_name === recruiter && country === _.country) {
          // console.log(_)
          return _;
        }
      })
    }
  }


  filterOnTableJBCLIENTB(client: string, bdm: string, country: string) {
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



  filterOnTableBdm(bdmName: string, country: String, status: String[], emptype: String[]) {
    console.log("filterOnTableBdm function");
    console.log("status: " + status);
    console.log("emptype: " + emptype);

    this.tabularDataForFilter = this.tabularData;
    // if (bdmName === 'ALL' && (country === 'none' || country === 'ALL') && ( status.includes('ALL') || status.length === 0) && ( emptype.includes('ALL') || emptype.length === 0)) {
    //   alert("hello1");
    //   this.tabularDataForFilter = this.tabularData;
    // }
    // else if (bdmName === 'ALL' && country === 'ALL' && ( !status.includes('ALL') || status.length !== 0) && ( !emptype.includes('ALL') || emptype.length !== 0) ) {
    //   this.tabularDataForFilter = this.tabularData.filter(_ => {
    //     console.log("In 1");
    //     if (status.includes(_.status) && emptype.includes(_.job_type)) {
    //       return _;
    //     }
    //   })
    // }
    // else if (bdmName === 'ALL' && country === 'ALL' && ( !status.includes('ALL') || status.length !== 0) && ( emptype.includes('ALL') || emptype.length === 0) ) {
    //   this.tabularDataForFilter = this.tabularData.filter(_ => {
    //     console.log("In 2");
    //     if (status.includes(_.status)) {
    //       return _;
    //     }
    //   })
    // }

    // else if (bdmName === 'ALL' && country !== 'none') {
    //   this.tabularDataForFilter = this.tabularData.filter(_ => {
    //     console.log("In 3");
    //     if (country === _.client_country) {
    //       // console.log(_)
    //       return _;
    //     }
    //   })
    // }
    // else if (bdmName !== 'ALL' && country === 'ALL') {
    //   this.tabularDataForFilter = this.tabularData.filter(_ => {
    //     console.log("In 4");
    //     if (bdmName === _.bdm_name && emptype.includes(_.job_type) && status.includes(_.status)) {
    //       // console.log(_)
    //       return _;
    //     }
    //   })
    // }
    // else {
    //   if( (status.includes('ALL') || status.length === 0) && (emptype.includes('ALL') || emptype.length === 0)){
    //     this.tabularDataForFilter = this.tabularData.filter(_ => {
    //       console.log("In 5");
    //       // console.log(_.bdm_name);
    //       if (bdmName === _.bdm_name && country === _.client_country) {
    //         // console.log(_)
    //         return _;
    //       }
    //     })
    //   }
    //   else if( (!status.includes('ALL') || status.length !== 0) && (emptype.includes('ALL') || emptype.length === 0)){
    //     this.tabularDataForFilter = this.tabularData.filter(_ => {
    //       console.log("In 6");
    //       // console.log(_.bdm_name);
    //       if (bdmName === _.bdm_name && country === _.client_country && status.includes(_.status)) {
    //         // console.log(_)
    //         return _;
    //       }
    //     })
    //   }else if( (status.includes('ALL') || status.length === 0) && (!emptype.includes('ALL') || emptype.length !== 0)){
    //     this.tabularDataForFilter = this.tabularData.filter(_ => {
    //       console.log("In 7");
    //       // console.log(_.bdm_name);
    //       if (bdmName === _.bdm_name && country === _.client_country && emptype.includes(_.job_type)) {
    //         // console.log(_)
    //         return _;
    //       }
    //     })
    //   }
    //   else{
    //     this.tabularDataForFilter = this.tabularData.filter(_ => {
    //       console.log("In 8");
    //       // console.log(_.bdm_name);
    //       if (bdmName === _.bdm_name && country === _.client_country && status.includes(_.status) && emptype.includes(_.job_type)) {
    //         // console.log(_)
    //         return _;
    //       }
    //     })
    //   }

    // }

    if (bdmName === 'ALL' && (country === 'none' || country === 'ALL') &&
     (emptype.includes('none') || emptype.includes('ALL')) &&
      (status.includes('ALL') || status.includes('none') || status.includes('Active'))) {
      console.log("Custom: In all");
      this.tabularDataForFilter = this.tabularData;
    }
    else if (bdmName === 'ALL' && country !== 'ALL') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("Custom: country: " + country);
        if (country === _.client_country) {
          // console.log(_)
          return _;
        }
      })
    }
    else if (bdmName !== 'ALL' && country === 'ALL') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("Custom: bdm: " + bdmName);
        if (bdmName === _.bdm_name) {
          // console.log(_)
          return _;
        }
      })
    }
    else if (bdmName === 'ALL' && country === 'ALL' && !emptype.includes('ALL')){
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("Custom: EmpT: " + emptype);
          return emptype.includes(_.job_type);
      })
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        console.log("Custom: else block");
        if (bdmName === _.bdm_name && country === _.client_country) {
          // console.log(_)
          return _;
        }
      })
    }

    if (status.length !== 0 && !status.includes('ALL') && emptype.length !== 0 && !emptype.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Custom: Status != none & empT != none");
        return status.includes(_.status) && emptype.includes(_.job_type);
      })
    }
    else if (status.length !== 0 && status.includes('ALL') && emptype.length !== 0 && !emptype.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Custom: Status = ALL $ empT != none");
        return emptype.includes(_.job_type);
      })
    }
    else if (status.length !== 0 && !status.includes('ALL') && emptype.length !== 0 && emptype.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Custom: Status != ALL & empT = ALL");
        return status.includes(_.status);
      })
    }
    else if (status.length === 0 && !status.includes('ALL') && emptype.length !== 0 && emptype.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Custom: Status = 0 & empT = ALL");
        return null;
      })
    }
    else if (status.length === 0 && !status.includes('ALL') && emptype.length !== 0 && !emptype.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Custom: Status = 0 & empT != ALL");
        return null;
      })
    }
    else if (status.length !== 0 && status.includes('ALL') && emptype.length === 0 && !emptype.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Custom: Status = ALL & empT = 0");
        return null;
      })
    }
    else if (status.length !== 0 && !status.includes('ALL') && emptype.length === 0 && !emptype.includes('ALL')) {
      this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
        console.log("Custom: Status != ALL & empT = 0");
        return null;
      })
    }

  //   if(status.length !== 0){
  //   this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
  //     if (status === _.status ) {
  //       // console.log(_)
  //       return _;
  //     }
  //   })
  // }

  // if(emptype.length !== 0){
  //   this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
  //     if (emptype === _.job_type ) {
  //       // console.log(_)
  //       return _;
  //     }
  //   })
  // }

  // if(!status.includes('ALL') || status.length !== 0 && !emptype.includes('ALL') || emptype.length !== 0){
  //   this.tabularDataForFilter = this.tabularDataForFilter.filter(_ => {
  //     if (status === _.status && emptype === _.job_type) {
  //       // console.log(_)
  //       return _;
  //     }
  //   })
  // }
  }

  filterOnTableRecruiter(bdmName: string, country: String) {
    console.log("filterOnTable");
    this.tabularDataForFilter = this.tabularData;
    if ((bdmName === 'ALL' && country === 'none') || (bdmName === 'ALL' && country === 'ALL')) {
      this.tabularDataForFilter = this.tabularData;
    }

    else if (bdmName === 'ALL' && country !== 'none') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (country === _.country) {
          // console.log(_)
          return _;
        }
      })
    }
    else if (bdmName !== 'ALL' && country === 'ALL') {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (bdmName === _.recruiter_name) {
          // console.log(_)
          return _;
        }
      })
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (bdmName === _.recruiter_name && country === _.country) {
          // console.log(_)
          return _;
        }
      })
    }
  }

  filterRecruiterBdmJobs(bdmName: string): void {
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
  filterOnTableBdmJobs(bdmName: string) {
    console.log("Ev: " + bdmName);
    this.tabularDataForFilter = this.tabularData;
    if (bdmName === 'ALL') {
      this.tabularDataForFilter = this.tabularData;
    }
    else {
      console.log("get data:");
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (bdmName === _.full_name) {
          // console.log(_)
          return _;
        }
      })
    }
  }

  filterRecruiterJobAging(bdmName: string): void {
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

  filterOnTableJobAging(bdmName: string) {
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

  // Getting Segment For API call to get data
  getAPISegment(id: string, label: string, tag: string, datelabel: String, dateForMoreThan30days: string) {
    var segment;
    var dateParams
    if (this.dateRange !== ReportDateRange.CUSTOM) {
      dateParams = `&date_range=${this.dateRange}`;
    } else {
      dateParams = `&start_date=${this.startDate}&end_date=${this.endDate}`;
    }
    if (tag === ReportTags.CLIENT_REVENUE) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        dateParams = `&date_range=${this.dateRange}`;
      } else {
        dateParams = `&start_date=${this.startDate}&end_date=${this.endDate}`;
      }
    }
    if (tag === ReportTags.BDM) {
      segment = `?bdm_id=${id}&stage=${label}${dateParams}`;
    }
    if (tag === ReportTags.RECRUITER || tag === ReportTags.RECRUITER_PERFORMANCE || this.tag === ReportTags.CANDIDATE_REPORT) {
      segment = `?recruiter_id=${id}&stage=${label}${dateParams}`;
    }
    if (tag === ReportTags.JOB_SUMMARY) {
      segment = `?job_id=${id}&stage=${label}${dateParams}`;
    }
    if (tag === ReportTags.JOBS_BY_CLIENT) {
      segment = `?job_id=${id}&stage=${label}${dateParams}`;
    }
    if (tag === ReportTags.BDM_JOBS) {
      if (this.dateRange !== ReportDateRange.CUSTOM)
        segment = `?job_creater_id=${id}&single_date=${datelabel}`;
      else {
        var diffdays = this.getDays(this.startDate, this.endDate);
        if (diffdays <= 30) {
          segment = `?job_creater_id=${id}&single_date=${datelabel}`;
        }
        else if (diffdays > 30) {
          var year = dateForMoreThan30days.split("-")[0];
          var month = dateForMoreThan30days.split("-")[1];
          segment = `?job_creater_id=${id}&month=${month}&year=${year}`;
        }
      }
    }

    this.getCandidateDetailsFromAPI(segment, id, label, tag, datelabel, dateForMoreThan30days);
    this.getClientDetailsFromAPI(segment, id, label, tag, datelabel, dateForMoreThan30days);
  }



  // Get Client Data from API
  getClientDetailsFromAPI(segment, id, label, tag, datelabel, dateForMoreThan30days) {
    this._api.getReportWithApiLink(`${APIPath.CLIENT_REVENUE_GRAPH}${segment}`).subscribe(res => {
      res.forEach(_ => {
        Object.keys(_).forEach(key => {
          if (_[key] === null)
            _[key] = "--";
          if (key === "actual_revenue") {
            _[key] = _[key][0]['total_revenue'];
          }
          if (key === "actual_revenue") {
            _[key] = _[key][0]['expected_revenue'];
          }
          if (key === "client_name_value" && (_[key] !== null || _[key] !== undefined)) { Object.keys(_[key]).forEach(i => { if (_[key][i] === null) _[key][i] = "--" }) }
        }
        );
        res.forEach(_ => {
          if (_.client_name_value) {
            //_.clin= _.candidate_name.first_name+" "+_.candidate_name.last_name;
            _.client_name_value.expected_revenue = moment(_.client_name_value.expected_revenue).format('YYYY-MM-DD');
            _.client_name_value.actual_revenue = moment(_.client_name_value.actual_revenue).format('YYYY-MM-DD');
          }
        });
      })
      this.openCandidateDetailsModal(res, id, label, tag, datelabel, dateForMoreThan30days)
    }, error => {
      console.log(error);
    }
    )
  }

  // To get Candidate Data from the API
  getCandidateDetailsFromAPI(segment, id, label, tag, datelabel, dateForMoreThan30days) {
    this._api.getReportWithApiLink(`${APIPath.GET_GRAPH_CANDIDATE_LIST}${segment}`).subscribe(res => {
      //console.log(res)
      res.forEach(_ => {
        Object.keys(_).forEach(key => {
          if (_[key] === null)
            _[key] = "--";
          if (key === "created_at") {
            _[key] = _[key].split("T")[0];
          }
          if (key === "candidate_name" && (_[key] !== null || _[key] !== undefined)) { Object.keys(_[key]).forEach(i => { if (_[key][i] === null) _[key][i] = "--" }) }
        }
        );
        res.forEach(_ => {
          if (_.candidate_name) {
            _.candidate_full_name = _.candidate_name.first_name + " " + _.candidate_name.last_name;
            _.candidate_name.created_at = moment(_.candidate_name.created_at).format('YYYY-MM-DD');
          }
        });
      })
      this.openCandidateDetailsModal(res, id, label, tag, datelabel, dateForMoreThan30days)
    }, error => {
      console.log(error);
    }
    )
  }

  openCandidateDetailsModal(res, id, label, tag, datelabel, dateForMoreThan30days) {
    const modalRef = this.modal.open(CandidateDetailsComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.candidates = res;
    modalRef.componentInstance.id = id;
    modalRef.componentInstance.label = label;
    modalRef.componentInstance.tag = tag;
    modalRef.componentInstance.isPopup = true;
    modalRef.componentInstance.dateRange = this.dateRange;
    modalRef.componentInstance.start_date = this.startDate;
    modalRef.componentInstance.end_date = this.endDate;
    modalRef.componentInstance.datelabel = datelabel;
    modalRef.componentInstance.dateForMoreThan30days = dateForMoreThan30days;

    modalRef.result.then(res => {
    }, error => {
      console.log(error);
    });
  }


  setBackground(): void {
    this.chartData = this.chartData
      .map((c: CustomizedDataSet, i: number) => {
        //.map((c: ChartDataSets, i: number) => {
        c.backgroundColor = this.chartType === ChartTypeEnum.BAR ? `rgba(${this.colors[i]}, 1)` : 'transparent';
        return c;
      });
  }

  dateRangeChangedInitial(event): void {

    if (this.tag === ReportTags.BDM || this.tag === ReportTags.BDM_JOBS || this.tag === ReportTags.JOB_AGE ||
      this.tag === ReportTags.CLIENT_REVENUE || this.tag === ReportTags.JOBS_BY_CLIENT || this.tag === ReportTags.JOB_SUMMARY) {
      this.dateRange = event;
    }
    else {
      this.dateRangeSelected = event;
    }
  }

  dateRangeChanged(event): void {

    // console.log(this.tag);
    // console.log(this.label_name)
    if (this.tag === ReportTags.BDM_JOBS) {
      this.label_name = "created_at";
    }
    this.dateRange = event;
    this.startDate = moment(new Date()).format('YYYY-MM-DD');
    this.endDate = moment(new Date()).format('YYYY-MM-DD');
    if (this.dateRange !== ReportDateRange.CUSTOM) {
      let id;

      if ((this.tag === ReportTags.RECRUITER_PERFORMANCE || this.tag === ReportTags.RECRUITER ||
         this.tag === ReportTags.CANDIDATE_REPORT) && this.xAxisFilter !== "All") {
        var recruiter = this.findRecruiterId(this.xAxisFilter);
        //console.log(recruiter)
        id = (recruiter != undefined) ? recruiter.id : null
      } else if ((this.tag === ReportTags.JOB_SUMMARY) && this.xAxisFilter !== "All") {
        var bdm = this.findBdm(this.xAxisFilter);
        //console.log(bdm)
        id = (bdm != undefined) ? bdm.bdm_id : null
      } else if ((this.tag === ReportTags.BDM) && this.xAxisFilter !== "All") {
        var bdm = this.findBdm(this.xAxisFilter);
        //console.log(bdm)
        id = (bdm != undefined) ? bdm.bdm_id : null
      } else if ((this.tag === ReportTags.BDM_JOBS) && this.xAxisFilter !== "All") {
        var bdm = this.findBdmForJob(this.xAxisFilter);
        // console.log(bdm);
        id = (bdm != undefined) ? bdm.client_name.created_by : null;
        // console.log("Id: " + id);
      }

      let apiParam = '';
      // if (id && (this.tag === ReportTags.RECRUITER_PERFORMANCE ||  this.tag === ReportTags.RECRUITER )) {

      //     apiParam = `?date_range=${this.dateRange}&recruiter_id=${id}&country=${this.clientCountry}`
      //   // apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&recruiter_id=${id}`

      // } else if (id && (this.tag === ReportTags.BDM || this.tag === ReportTags.JOB_SUMMARY)) {

      //     apiParam = `?date_range=${this.dateRange}&bdm_id=${id}&country=${this.clientCountry}`

      // } else {

      apiParam = `?date_range=${this.dateRange}`
      // apiParam = `?date_range=${this.dateRange}&country=${this.clientCountry}`

      // }

      this.getData(`${apiParam}`);

    }
  }

  // public openDateRangeModal(): void {
  //   this.startDate = moment(new Date()).format('YYYY-MM-DD');
  //   this.endDate = moment(new Date()).format('YYYY-MM-DD')
  //   if (this.tag === ReportTags.BDM_JOBS) {
  //     this.label_name = "created_at";
  //   }
  //   // this.getData(`?date_range=${ReportDateRange.TODAY}`);
  //   //this.startDate=new Date().toDateString();
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

  //     let id;

  //     if ((this.tag === ReportTags.RECRUITER_PERFORMANCE || this.tag === ReportTags.RECRUITER ||
  //        this.tag === ReportTags.JOBS_BY_CLIENT || this.tag === ReportTags.CANDIDATE_REPORT) && this.xAxisFilter !== "All") {
  //       var recruiter = this.findRecruiterId(this.xAxisFilter);
  //       //console.log(recruiter)
  //       id = (recruiter != undefined) ? recruiter.id : null
  //     } else if ((this.tag === ReportTags.JOB_SUMMARY) && this.xAxisFilter !== "All") {
  //       var bdm = this.findBdm(this.xAxisFilter);
  //       //console.log(bdm)
  //       id = (bdm != undefined) ? bdm.bdm_id : null
  //     } else if ((this.tag === ReportTags.BDM) && this.xAxisFilter !== "All") {
  //       var bdm = this.findBdm(this.xAxisFilter);
  //       //console.log(bdm)
  //       id = (bdm != undefined) ? bdm.bdm_id : null
  //     } else if ((this.tag === ReportTags.BDM_JOBS) && this.xAxisFilter !== "All") {
  //       var bdm = this.findBdmForJob(this.xAxisFilter);
  //       id = (bdm != undefined) ? bdm.client_name.created_by : null;
  //       console.log("Id: " + id);
  //     }

  //     let apiParam = '';
  //     // if (id && (this.tag === ReportTags.RECRUITER_PERFORMANCE ||  this.tag === ReportTags.RECRUITER )) {

  //     //     apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&recruiter_id=${id}&country=${this.clientCountry}`

  //     // } else if (id && (this.tag === ReportTags.BDM || this.tag === ReportTags.JOB_SUMMARY)) {

  //     //     apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&bdm_id=${id}&country=${this.clientCountry}`

  //     // } else {

  //     apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}`

  //     // }


  //     this.getData(`${apiParam}`);
  //   }, error => {
  //     console.log(error);
  //   })
  // }

  getDays(startDate: string, endDate: string) {
    var sDate = new Date(startDate);
    var eDate = new Date(endDate);
    var diffTime = eDate.getTime() - sDate.getTime();
    return diffTime / (1000 * 3600 * 24);
  }

  openDateRangeModal() {
    this.startDate = moment(new Date()).format('YYYY-MM-DD');
    this.endDate = moment(new Date()).format('YYYY-MM-DD')
    if (this.tag === ReportTags.BDM_JOBS) {
      this.label_name = "created_at";
    }
    // this.getData(`?date_range=${ReportDateRange.TODAY}`);
    //this.startDate=new Date().toDateString();
    const modalRef = this.modal.open(DateRangePickerComponent, {
      backdrop: 'static', keyboard: false, centered: true,
    });
    modalRef.componentInstance.startDate = this.startDate;
    modalRef.componentInstance.endDate = this.endDate;

    modalRef.result.then(result => {
      this.handleDateRangeResultNew(result);
    }, error => {
      console.log(error);
    });
  }

  private handleDateRangeResultNew(result: any): void {
    this.startDate = result.startDate
    this.endDate = result.endDate
    this.dateRangeResult = result;
    var diffdays = this.getDays(this.startDate, this.endDate);
    console.log("no of days" + diffdays);
    if (diffdays > 30 && this.tag === ReportTags.BDM_JOBS) {
      this.label_name = 'month';
    }
  }

  dateRangeSelection(): void {
    if (this.dateRangeResult) {
      this.startDate = this.dateRangeResult.startDate;
      this.endDate = this.dateRangeResult.endDate;
      let id;

      if ((this.tag === ReportTags.RECRUITER_PERFORMANCE || this.tag === ReportTags.RECRUITER ||
          this.tag === ReportTags.JOBS_BY_CLIENT || this.tag === ReportTags.CANDIDATE_REPORT) && this.xAxisFilter !== "All") {
        var recruiter = this.findRecruiterId(this.xAxisFilter);
        //console.log(recruiter)
        id = (recruiter != undefined) ? recruiter.id : null
      } else if ((this.tag === ReportTags.JOB_SUMMARY) && this.xAxisFilter !== "All") {
        var bdm = this.findBdm(this.xAxisFilter);
        //console.log(bdm)
        id = (bdm != undefined) ? bdm.bdm_id : null
      } else if ((this.tag === ReportTags.BDM) && this.xAxisFilter !== "All") {
        var bdm = this.findBdm(this.xAxisFilter);
        //console.log(bdm)
        id = (bdm != undefined) ? bdm.bdm_id : null
      } else if ((this.tag === ReportTags.BDM_JOBS) && this.xAxisFilter !== "All") {
        var bdm = this.findBdmForJob(this.xAxisFilter);
        id = (bdm != undefined) ? bdm.client_name.created_by : null;
        console.log("Id: " + id);
      }

      let apiParam = '';
      apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}`;
      this.getData(`${apiParam}`);

    } else {
      console.log("Date range not selected");
    }
  }


  // Legends settings
  protected getStatus(data: Array<T>): void {
    const clientStatus = new Set<string>();
    const status = new Set<string>();

    if (this.tag === ReportTags.BDM_JOBS) {
      data.forEach((el: T) => {
        // if(el['stage_name']!=="Candidate Added")
        status.add(el['bdm_name']);
      });

    }
    else {
      data.forEach((el: T) => {
        status.add(el['stage_name']);
      });
    }


    this.allStages = Array.from(status);
    this.allStagesDummy = Array.from(status);
    if (this.label_name === 'month') {
      this.data = data = data.sort((a: any, b: any) => {
        if (a['created_at'] < b['created_at']) {
          return -1
        } else if (a['created_at'] > b['created_at']) {
          return 1
        } else {
          return 0;
        }
      });
    }
    else {
      //this.graphData= data;
      this.data = data = data.sort((a: any, b: any) => {
        if (a[this.label_name] < b[this.label_name]) {
          return -1
        } else if (a[this.label_name] > b[this.label_name]) {
          return 1
        } else {
          return 0;
        }
      });
    }


    this.xAxisFilterArray = this.getAllXAxisLabel();
    if (this.tag === ReportTags.JOB_SUMMARY || this.tag === ReportTags.BDM || this.tag === ReportTags.RECRUITER ||
       this.tag === ReportTags.RECRUITER_PERFORMANCE || this.tag === ReportTags.RECRUITER ||
       this.tag === ReportTags.CANDIDATE_REPORT || this.tag === ReportTags.BDM_JOBS || this.tag === ReportTags.JOB_AGE) {
      this.filterRecruiter(this.bdmName);
    } else {
      this.filterRecruiter('ALL');
    }

  }

  protected resetChartData() {
    this.chartData = [];




    this.allStages.sort().forEach((a, i) => {
      this.chartData.push({
        label: a,
        data: [],
        borderColor: `rgba(${this.colors[i]},1)`,
        backgroundColor: `rgba(${this.colors[i]},1)`,
        hoverBackgroundColor: `rgba(${this.colors[i]},.8)`,
        wholeDataSet: []
      });
      this.setBackground();
    });
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
    { headerName: "Client Country", field: "country", sortable: true, filter: true },
    { headerName: "BDM Name", field: "bdm_name", sortable: true, filter: true },
    { headerName: "Recruiter Name", field: "recruiter_name", sortable: true, filter: true },
    { headerName: "Candidate Location", field: "location", sortable: true, filter: true },
    { headerName: "Visa", field: "visa", sortable: true, filter: true },
    { headerName: "Job Type", field: "job_type", sortable: true, filter: true },
    { headerName: "Submission Date", field: "submission_date", sortable: true, filter: true },
    { headerName: "Job Date", field: "job_date", sortable: true, filter: true },
    { headerName: "Remarks", field: "remarks", sortable: true, filter: true, width: 1000 },
  ];

  protected getAllXAxisLabel(): Array<string> {
    const recruiter = new Set<Label>();
    console.log(this.data)
    if (this.tag === ReportTags.BDM_JOBS && this.label_name === "created_at") {
      console.log("Inside ")
      this.data.forEach((el: T) => {
        console.log(recruiter);
        recruiter.add(el[this.label_name].split(" ")[0]);
      });
    }
    else if (this.tag === ReportTags.CLIENT_REVENUE && this.label_name === "client_name_value") {
      this.data.forEach(el => {
        if (parseFloat(el['client_name_value']) > 0) {
          recruiter.add(el[this.label_name]);
          // console.log(recruiter)
        }
      });
    }

    else if (this.tag === ReportTags.BDM_JOBS && this.label_name === "month") {
      this.data.forEach((el: T) => {
        recruiter.add(el[this.label_name] + " '" + el['created_at'].substr(2, 2));
      });
    }
    // else if (this.tag === ReportTags.BDM || this.tag === ReportTags.RECRUITER){
    //  if (this.data.country === 'US'){

    //  }
    //  else{
    //   this.data.forEach((el: T) => {
    //     recruiter.add(el[this.label_name]);
    //   });
    // }
    //}
    else {
      this.data.forEach((el: T) => {
        console.log("REport: " + this.label_name)
        recruiter.add(el[this.label_name]);
      });
    }
    return Array.from(recruiter) as Array<string>;
  }


  protected getAllXAxisCountryLabel(): Array<string> {
    const recruiter = new Set<Label>();
    console.log(this.data)
    // if (this.tag === ReportTags.BDM_JOBS && this.label_name === "created_at") {
    //   console.log("Inside ")
    //   this.data.forEach((el: T) => {
    //     console.log(recruiter);
    //     recruiter.add(el[this.label_name]); //.split(" ")[0]
    //   });
    // }
    // else if (this.tag === ReportTags.CLIENT_REVENUE && this.label_name === "client_name_value") {
    //   this.data.forEach(el => {
    //     if (parseFloat(el['client_name_value']) > 0) {
    //       recruiter.add(el[this.label_name]);
    //       // console.log(recruiter)
    //     }
    //   });
    // }

    // else if (this.tag === ReportTags.BDM_JOBS && this.label_name === "month") {
    //   this.data.forEach((el: T) => {
    //     recruiter.add(el[this.label_name] + " '" + el['created_at'].substr(2, 2));
    //   });
    // }
    // // else if (this.tag === ReportTags.BDM || this.tag === ReportTags.RECRUITER){
    // //  if (this.data.country === 'US'){

    // //  }
    // //  else{
    // //   this.data.forEach((el: T) => {
    // //     recruiter.add(el[this.label_name]);
    // //   });
    // // }
    // //}
    // else {
    this.data.forEach((el: T) => {
      console.log("REport: " + this.label_name)
      recruiter.add(el[this.label_name]);
    });
    // }
    return Array.from(recruiter) as Array<string>;
  }



  filterCountry(event: string): void {
    this.isCompleted = false;
    if (event === 'ALL') {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    } else if (event === 'US') {
      //this.chartLabels = [event];
      if (this.data.country === 'US') {
        this.getAllXAxisLabel().forEach(label => {

        })
      }
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    }

    else if (event === 'India') {
      // this.chartLabels = [event];
    }
    else {
      this.chartLabels = [event];
    }
    this.resetChartData();
    this.filterData(this.data);
  }



  // To filter Recruiter Chart labels
  filterRecruiter(event: string): void {
    this.isCompleted = false;
    if (event === 'ALL') {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    } else {
      this.chartLabels = [event];
    }
    //console.log("this.chartLabels: " + this.chartLabels)
    this.resetChartData();
    this.filterData(this.data);
  }



  // TO Filter the ChartData
  protected filterData(data: Array<T>): void {
    this.isCompleted = false;

    this.chartData.forEach((status) => {
      status.wholeDataSet = [];
      this.chartLabels.forEach((name) => {
        var el;
        if (this.tag === ReportTags.BDM_JOBS) {
          if (this.label_name === 'created_at') {
            // console.log(el);
            (this.bdmName === 'ALL') ?
              el = data.find(el => { return (el[this.label_name].split(" ")[0] === name && el['bdm_name'] === status.label) }) :
              el = data.find(el => { return (el[this.label_name].split(" ")[0] === name && el['bdm_name'] === status.label && el['bdm_name'] === this.bdmName) })
          }
          else {
            (this.bdmName === 'ALL') ?
              el = data.find(el => (el[this.label_name] + " '" + el['created_at'].substr(2, 2)) === name && el['bdm_name'] === status.label) :
              el = data.find(el => (el[this.label_name] + " '" + el['created_at'].substr(2, 2)) === name && el['bdm_name'] === status.label && el['bdm_name'].split(" ")[0] === this.bdmName)
          }
        }
        else if (this.tag === ReportTags.CLIENT_REVENUE) {
          if (this.label_name === 'client_name_value') {
            (this.clientName === 'ALL') ?
              el = data.find(el => { return (el[this.label_name] === name && 'Expected Revenue' === status.label) }) :
              el = data.find(el => { return (el[this.label_name] === name && 'Expected Revenue' === status.label && el['client_name_value'] === this.clientName) })
          }
          else {
            (this.clientName === 'ALL') ?
              el = data.find(el => el[this.label_name] === name && el['client_name_value'] === status.label) :
              el = data.find(el => el[this.label_name] === name && el['client_name_value'] === status.label && el['client_name_value'][0] === this.clientName)
            // console.log("In this");
          }
        }

        // else if (this.tag === ReportTags.JOB_SUMMARY) {
        //   if (this.label_name === 'client_name_value') {
        //     (this.clientName === 'ALL') ?
        //       el = data.find(el => { return (el[this.label_name] === name && 'Expected Revenue' === status.label) }) :
        //       el = data.find(el => { return (el[this.label_name] === name && 'Expected Revenue' === status.label && el['client_name_value'] === this.clientName) })
        //   }
        //   else {
        //     (this.clientName === 'ALL') ?
        //       el = data.find(el => el[this.label_name] === name && el['client_name_value'] === status.label) :
        //       el = data.find(el => el[this.label_name] === name && el['client_name_value'] === status.label && el['client_name_value'][0] === this.clientName)
        //     // console.log("In this");
        //   }
        // }
        else if (this.tag === ReportTags.JOBS_BY_CLIENT) {
          // if (this.label_name === 'company_name') {
          //   (this.xAxisFilter === 'ALL') ?
          //     el = data.find(el => { return (el[this.label_name] === name && el['stage_name'] === status.label) }) :
          //     el = data.find(el => { return (el[this.label_name] === name && el['stage_name'] === status.label && el['stage_name'] === this.xAxisFilter) })
          // }
          // else {
          //   (this.xAxisFilter === 'ALL') ?
          //     el = data.find(el => el[this.label_name] === name && el['company_name'] === status.label) :
          //     el = data.find(el => el[this.label_name] === name && el['company_name'] === status.label && el['company_name'][0] === this.xAxisFilter)
          //   // console.log("In this");
          // }



          if (this.xAxisFilter === 'ALL' && (this.xAxisFilterCountry === 'none' || this.xAxisFilterCountry === 'ALL') && (this.xAxisFilterBDM === 'none' || this.xAxisFilterBDM === 'ALL')) {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label)
          }

          else if (this.xAxisFilter === 'ALL' && this.xAxisFilterCountry !== 'none' && this.xAxisFilterBDM === 'ALL') {
                       el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['country'] === this.xAxisFilterCountry)

          }

          else if (this.xAxisFilter === 'ALL' && this.xAxisFilterCountry === 'ALL' && (this.xAxisFilterBDM !== 'none' && this.xAxisFilterBDM !== 'ALL')) {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['bdm_name'] === this.xAxisFilterBDM)

          }

          else if (this.xAxisFilter !== 'none' && (this.xAxisFilterCountry !== 'none' && this.xAxisFilterCountry !== 'ALL') && this.xAxisFilterBDM === 'ALL') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['country'] === this.xAxisFilterCountry && el['company_name'] === this.xAxisFilter)

          }

          else if ((this.xAxisFilter !== 'none' && this.xAxisFilter !== 'ALL') && this.xAxisFilterCountry === 'ALL' && this.xAxisFilterBDM === 'ALL') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['company_name'] === this.xAxisFilter)

          }
          else if (this.xAxisFilter === 'ALL' && this.xAxisFilterCountry !== 'none' && this.xAxisFilterBDM !== 'none') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['country'] === this.xAxisFilterCountry && el['bdm_name'] === this.xAxisFilterBDM)

          }

          else if (this.xAxisFilter !== 'none' && this.xAxisFilterCountry === 'ALL' && (this.xAxisFilterBDM !== 'none' && this.xAxisFilterBDM !== 'ALL')) {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['company_name'] === this.xAxisFilter && el['bdm_name'] === this.xAxisFilterBDM)

          }

          else {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['company_name'] === this.xAxisFilter && el['country'] === this.xAxisFilterCountry && el['bdm_name'] === this.xAxisFilterBDM)

          }














          // if (this.xAxisFilter === 'ALL' && (this.xAxisFilterCountry === 'none' || this.xAxisFilterCountry === 'ALL')) {
          //   el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label)

          // }


          // else if (this.xAxisFilter === 'ALL' && this.xAxisFilterCountry !== 'none') {
          //   el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['country'] === this.xAxisFilterCountry)

          // }
          // else if (this.xAxisFilter !== 'ALL' && this.xAxisFilterCountry === 'ALL') {
          //   el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && this.xAxisFilter === el['company_name'])


          // }
          // else {
          //   el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && this.xAxisFilter === el['company_name'] && el['country'] === this.xAxisFilterCountry)
//
          // }
        }
        else if (this.tag === ReportTags.JOB_AGE) {

          if (this.xAxisFilter === 'ALL') {
            el = data.find(el => el[this.label_name] === name)
          }
          else if (this.xAxisFilter !== 'ALL') {
            el = data.find(el => el[this.label_name] === name && this.xAxisFilter.includes(el['bdm_name']))
          }

        }
        else if (this.tag === ReportTags.BDM) {

          if (this.xAxisFilter === 'ALL' && (this.xAxisFilterCountry === 'none' || this.xAxisFilterCountry === 'ALL')) {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label)

          }


          else if (this.xAxisFilter === 'ALL' && this.xAxisFilterCountry !== 'none') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['country'] === this.xAxisFilterCountry)

          }
          else if (this.xAxisFilter !== 'ALL' && this.xAxisFilterCountry === 'ALL') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && this.xAxisFilter.includes(el['first_name']))


          }
          else {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && this.xAxisFilter.includes(el['first_name']) && el['country'] === this.xAxisFilterCountry)

          }
        }

        else if (this.tag === ReportTags.JOB_SUMMARY) {
          if (this.bdmName === 'ALL' && (this.clientCountry === 'none' || this.clientCountry === 'ALL')) {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label)
          }
          else if (this.bdmName === 'ALL' && this.clientCountry !== 'none') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['country'] === this.clientCountry)
          }
          else if (this.bdmName !== 'ALL' && this.clientCountry === 'ALL') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && this.bdmName.includes(el['bdm_name']))
          }
          else {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && this.bdmName.includes(el['bdm_name']) && el['country'] === this.clientCountry)
          }
        }

        else {

          if (this.xAxisFilter === 'ALL' && (this.xAxisFilterCountry === 'none' || this.xAxisFilterCountry === 'ALL')) {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label)

          }


          else if (this.xAxisFilter === 'ALL' && this.xAxisFilterCountry !== 'none') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && el['country'] === this.xAxisFilterCountry)

          }
          else if (this.xAxisFilter !== 'ALL' && this.xAxisFilterCountry === 'ALL') {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && this.xAxisFilter.includes(el['first_name']))

          }
          else {
            el = data.find(el => el[this.label_name] === name && el['stage_name'] === status.label && this.xAxisFilter.includes(el['first_name']) && el['country'] === this.xAxisFilterCountry)

          }

        }

        if (el) {
          if (this.tag === ReportTags.CLIENT_REVENUE) {
            (status.label === "Expected Revenue") ?
              status.data.push(parseFloat(el['expected_revenue'])) :
              status.data.push(parseFloat(el['actual_revenue']))
            // console.log(status.data)
          }
          if (this.tag === ReportTags.JOB_AGE){
            status.data.push(parseInt(el['job_age']));
          }

          else if (this.tag === ReportTags.CANDIDATE_REPORT){
            const matchingElements = data.filter((item) => item[this.label_name] === name);

            if (matchingElements.length > 0) {
              // Accumulate total_count for repeated names
              const totalCount = matchingElements.reduce((sum, item) => sum + parseInt(item['total_count']), 0);

              status.data.push(totalCount);
              status.wholeDataSet.push(...matchingElements);
              status.tag = this.tag;
            }

          }

          else if (this.tag === ReportTags.JOB_SUMMARY) {
            const matchingElements = data.filter(el =>
              el[this.label_name] === name && el['stage_name'] === status.label && (this.bdmName === 'ALL' || this.bdmName.includes(el['bdm_name']))
            );

            if (matchingElements.length > 0) {
                const totalCount = matchingElements.reduce((sum, item) => sum + parseInt(item['total_count']), 0);
                status.data.push(totalCount);
                status.wholeDataSet.push(...matchingElements);
                status.tag = this.tag;
            }
          }

          else if (this.tag === ReportTags.BDM || this.tag === ReportTags.RECRUITER_PERFORMANCE ||
            this.tag === ReportTags.RECRUITER) {
            const matchingElements = data.filter(el => el[this.label_name] === name && el['stage_name'] === status.label);
            if (matchingElements.length > 0) {
              // Accumulate total_count for matching stage_name
              const totalCount = matchingElements.reduce((sum, item) => sum + parseInt(item['total_count']), 0);
              status.data.push(totalCount);
              status.wholeDataSet.push(...matchingElements);
              status.tag = this.tag;
            }
          }

          else{
            status.data.push(parseInt(el['total_count']));
          status.wholeDataSet.push(el);
          status.tag = this.tag;
          }
        }
        else {
          status.data.push(0);
        }
      });
    });

    this.isCompleted = true;
  }

  findUserId(name) {
    console.log("this.data: " + JSON.stringify(this.tabularData))
    let el = this.tabularData.find(el => { console.log(el['bdm_name']); return ((el['bdm_name'] === name) ? el['bdm_id'] : el['bdm_name']) })
    return el
  }

  findRecruiterId(name) {
    console.log("this.data: " + name)
    console.log("this.data: " + JSON.stringify(this.allUsers))
    let el = this.allUsers.find(el => { return ((el['bdm_name'] === name) ? el['id'] : null) })
    return el
  }

  findBDMIdInClient(name) {
    // console.log("this.data: " + name)
    // console.log("this.data: " + JSON.stringify(this.allUsers))
    let el = this.allBDMS.find(el => { return ((el['bdm_name'] === name) ? el['id'] : null) })
    return el
  }

  findBdm(name) {
    if (name === "none") {
      return;
    }
    console.log("this.data: " + name)
    console.log("this.data: " + JSON.stringify(this.tabularData))
    let el = this.tabularData.find(el => { return ((el['bdm_name'] === name) ? el['bdm_id'] : null) })
    return el
  }

  findBdmForJob(name) {
    if (name === "none") {
      return;
    }
    console.log("this.data: " + name);
    console.log("this.data: " + JSON.stringify(this.tabularData));
    let el = this.tabularData.find(el => {
      return(function() {
      let clientName = el['client_name'];
        if (clientName) {
            let fullName = `${clientName['first_name']} ${clientName['last_name']}`;
            return (fullName === name) ? clientName['created_by'] : null;
      }
      return null;
      })();
    });
    console.log("filtered ob: " + JSON.stringify(el));
    return el;
  }

  findClientId(name) {
    console.log("this.data: " + name)
    console.log("this.data: " + JSON.stringify(this.tabularData))
    let el = this.tabularData.find(el => { return ((el['client_name_value'] === name) ? el['id'] : null) })
    return el
  }


  findBdmFirstName(name) {
    console.log("this.data: " + name)
    console.log("this.data: " + JSON.stringify(this.tabularData))
    let el = this.tabularData.find(el => { return ((el['bdm_name'].split(" ")[0] === name) ? el['bdm_id'] : null) })
    return el
  }


  downloadFile(fileName: string): void {
    //console.log(this.chartLabels)
    //let userId = this.findUserId(this.chartLabels)
    //console.log("userId: " + JSON.stringify(userId))
    let id;
    let bid;
    let country;
    //console.log("this.xAxisFilter: " + this.xAxisFilter + ' fileName: ' + fileName)

    if (fileName === "job_submissions_by_client") {
      var bdm = this.findBDMIdInClient(this.xAxisFilterBDM);
      //console.log(recruiter)
      bid = (bdm != undefined) ? bdm.id : null
    }

    if ((fileName === "recruiter_performance_summary" || fileName === "recruiter_submission_summary" ||
      fileName === "job_submissions_by_client" || fileName === "candidate_report" || fileName === "job_aging") &&
      this.xAxisFilter !== "All") {
      var recruiter = this.findRecruiterId(this.xAxisFilter);
      //console.log(recruiter)
      id = (recruiter != undefined) ? recruiter.id : null
    } else if ((fileName === "job_summary") && this.xAxisFilter !== "All") {
      var bdm = this.findBdm(this.xAxisFilter);
      //console.log(bdm)
      id = (bdm != undefined) ? bdm.bdm_id : null
    } else if ((fileName === "bdm_performance_summary") && this.xAxisFilter !== "All") {
      var bdm = this.findBdm(this.xAxisFilter);
      //console.log(bdm)
      id = (bdm != undefined) ? bdm.bdm_id : null
    } else if ((fileName === "bdm_jobs") && this.xAxisFilter !== "All") {
      var bdm = this.findBdmForJob(this.xAxisFilter);
      // console.log(bdm);
      id = (bdm != undefined) ? bdm.client_name.created_by : null;
    } else if ((fileName === "client_revenue") && this.xAxisFilter !== "ALL") {
      var client = this.findClientId(this.xAxisFilter);
      // console.log(client);
      id = (client != undefined) ? client.id : null;
    }
    // if(( fileName === "job_summary") && this.xAxisFilter !== "All" && this.clientCountry != undefined){
    //   country = this.clientCountry;
    // }
    console.log("id")
    console.log(id)
    let apiParam = '';
    if (id && (fileName === "recruiter_performance_summary")) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}&recruiter_id=${id}&country=${this.clientCountry}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&recruiter_id=${id}&country=${this.clientCountry}`
      }
    } else if (id && (fileName === "job_submissions_by_client") && !bid) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}&client_id=${id}&country=${this.clientCountry}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&client_id=${id}&country=${this.clientCountry}`
      }
    } else if (id && (fileName === "job_submissions_by_client") && bid) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}&client_id=${id}&country=${this.clientCountry}&bdm_id=${bid}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&client_id=${id}&country=${this.clientCountry}&bdm_id=${bid}`
      }
    }else if (!id && (fileName === "job_submissions_by_client") && bid) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}&country=${this.clientCountry}&bdm_id=${bid}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&country=${this.clientCountry}&bdm_id=${bid}`
      }
    } else if (id && (fileName === "bdm_performance_summary" || fileName === "job_summary")) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        if (this.selectedEmpType.length !== 0 && this.selectedOptions.length !== 0 && !this.selectedOptions.includes("ALL")) {
          apiParam = `?date_range=${this.dateRange}&bdm_id=${id}&country=${this.clientCountry}&status=${this.selectedOptions}&employment_type=${this.selectedEmpType}`
        }
        else if(this.selectedEmpType.length !== 0 &&  this.selectedOptions.length==0){
          apiParam = `?date_range=${this.dateRange}&bdm_id=${id}&country=${this.clientCountry}&employment_type=${this.selectedEmpType}`
        }
        else if(this.selectedEmpType.length === 0 &&  this.selectedOptions.length!==0 && !this.selectedOptions.includes("ALL")){
          apiParam = `?date_range=${this.dateRange}&bdm_id=${id}&country=${this.clientCountry}&status=${this.selectedOptions}`
        }
        else {
          apiParam = `?date_range=${this.dateRange}&bdm_id=${id}&country=${this.clientCountry}`
        }

      } else {
        if (this.selectedEmpType.length !== 0 && this.selectedOptions.length !== 0 && !this.selectedOptions.includes("ALL")) {
          apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&bdm_id=${id}&country=${this.clientCountry}&status=${this.selectedOptions}&employment_type=${this.selectedEmpType}`
        } else {
          apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&bdm_id=${id}&country=${this.clientCountry}`
        }

      }
    } else if ((fileName === "job_summary" && this.selectedEmpType.length !== 0 && this.selectedOptions.length !== 0 && !this.selectedOptions.includes("ALL"))) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}&country=${this.clientCountry}&status=${this.selectedOptions}&employment_type=${this.selectedEmpType}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&country=${this.clientCountry}&status=${this.selectedOptions}&employment_type=${this.selectedEmpType}`
      }
    } else if (id && (fileName === "recruiter_submission_summary" || fileName === "candidate_report")) {
      if (this.dateRangeSelected !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRangeSelected}&recruiter_id=${id}&country=${this.clientCountry}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&recruiter_id=${id}&country=${this.clientCountry}`
      }
    } else if (fileName === "recruiter_submission_summary" || fileName === "candidate_report") {
      if (this.dateRangeSelected !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRangeSelected}&country=${this.clientCountry}`
      }
      else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&country=${this.clientCountry}`
      }
    } else if (id && (fileName === "bdm_jobs" || fileName === "job_aging")) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}&bdm_id=${id}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&bdm_id=${id}`
      }
    } else if (fileName === "bdm_jobs" || fileName === "job_aging") {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}`
      }
    } else if (id && (fileName === "client_revenue")) {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}&client_id=${id}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&client_id=${id}`
      }
    } else if (fileName === "client_revenue") {
      if (this.dateRange !== ReportDateRange.CUSTOM) {
        apiParam = `?date_range=${this.dateRange}`
      } else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}`
      }
    }

    else {
      if (this.dateRange !== ReportDateRange.CUSTOM ) {
        apiParam = `?date_range=${this.dateRange}&country=${this.clientCountry}`
      }
      else {
        apiParam = `?start_date=${this.startDate}&end_date=${this.endDate}&country=${this.clientCountry}`
      }
    }
    this._api
      .getReportWithApiLink(`${this.csv_api}${apiParam}`, 'text')
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

}


interface CustomizedDataSet extends ChartDataSets {
  wholeDataSet: Array<any>;
  tag?: string
}
