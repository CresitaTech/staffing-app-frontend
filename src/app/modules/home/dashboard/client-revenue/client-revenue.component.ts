import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChartOptions, Module } from 'ag-grid-community';
import { Label } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { ClientRevenueGraphUnit, JobSummaryGraphUnit, ReportDateRange, ReportTags } from 'src/app/enums/report.enum';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { BaseReportComponent } from '../base-report/base-report.component';
import { ChartDataSets } from 'chart.js';
import * as moment from 'moment';


@Component({
  selector: 'app-client-revenue',
  templateUrl: './client-revenue.component.html',
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
export class ClientRevenueComponent<ClientRevenueGraphUnit> extends BaseReportComponent<ClientRevenueGraphUnit> implements OnInit {

  @Input() title: string
  @Input() show_download: boolean;
  @Input() show_tabular: boolean;
  public gridApi;
  private gridColumnApi;
  public defaultColDef;
  public modules: Module[];
  public rowData: [];



  graph_api = '/reports/get_client_revenue_graph/';
  table_api = '/reports/get_client_revenue_graph/';
  csv_api = '/reports/get_client_revenue_csv/';
  label_name = 'client_name_value';
  tag = ReportTags.CLIENT_REVENUE;


  constructor(_api: APIProviderService<ClientRevenueGraphUnit>,
    modal: NgbModal) { super(_api, modal) }

  ngOnInit(): void {
    this.xAxisFilter = "ALL";
    this.getData(`?date_range=${this.dateRange}`);
    // this.tabularData.forEach(item=>{
    //   if(item.job_date)
    //   item.job_date=  moment(item.job_date).format('MM/DD/YYYY');
    // })

    // console.log(this.chartData);
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
          var expected_revenue, actual_revenue;
          var dateForMoreThan30days;
          var dataset: Array<any> = element[0]._chart.tooltip._data.datasets[_datasetIndex].wholeDataSet;
          // console.log(dataset);
          var tag = element[0]._chart.tooltip._data.datasets[_datasetIndex].tag;
          if (tag === ReportTags.CLIENT_REVENUE) {
            dataset.filter(item => {
              if (item.client_name_value == label)
                id = item.id
            })
          }
          else
            if (tag === ReportTags.CLIENT_REVENUE) {
              var diffdays = $this.getDays($this.startDate, $this.endDate);
              console.log(diffdays)
              if ($this.dateRange === ReportDateRange.CUSTOM && diffdays > 30) {
                dataset.filter(item => {
                  if (item.month === label.split(" ")[0]) {
                    id = item.id;
                    // dateForMoreThan30days=item.created_at;
                    console.log(id);
                  }
                })
              }
              else {
                dataset.filter(item => {
                  if (item.client_name_value.split(" ")[0] == label)
                    id = item.id;
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

  applyFilters() {
    console.log("Inside apply");
    console.log("xAxisFilter: " + this.xAxisFilter);
    console.log("dateRangeSelected: " + this.dateRange);

    this.filterOnTable(this.xAxisFilter);
    this.filterClient(this.xAxisFilter);
    this.dateRangeChanged(this.dateRange);

    if (this.dateRange === ReportDateRange.CUSTOM) {
      this.dateRangeSelection();
    }
  }

  onXAxisFilterChange(event: any): void {
    this.xAxisFilter = event;
  }

  dateRangeChanged(event): void {
    this.dateRange = event;
    this.startDate = moment(new Date()).format('YYYY-MM-DD');
    this.endDate = moment(new Date()).format('YYYY-MM-DD');
    if (this.dateRange !== ReportDateRange.CUSTOM) {
      let apiParam = '';
      apiParam = `?date_range=${this.dateRange}`;
      this.getData(`${apiParam}`);
    }
  }

  // To get Data from API REQUEST
  protected getData(apiParams: string): void {
    this.setForClientName = new Set();
    forkJoin([
      this._api.getReportWithApiLink(`${this.graph_api}${apiParams}`),
      this._api.getReportWithApiLink(`${this.table_api}${apiParams}`)
    ])
      .subscribe((res: Array<any>) => {
        this.getStatus(res[0]);
        this.tabularData = res[1];
        this.tabularData.forEach(_ => {
          Object.keys(_).forEach(key => {
            if (_[key] === null)
              _[key] = "--";
          });
          //  if(_.actual_revenue){
          //   _.actual_revenue=  _.actual_revenue.split("")[0];
          //  }
          //  if(_.expected_revenue){
          //    _.expected_revenue=  _.expected_revenue.split("")[0];
          //  }
          if (this.tag === ReportTags.CLIENT_REVENUE) {
            this.setForClientName.add(_.client_name_value);
            //  console.log(this.setForClientName)
          }
        })
        this.tabularDataForFilter = this.tabularData;
        // this.xAxisFilter = 'ALL'
        // this.clientName = 'ALL'
        this.filterOnTable(this.xAxisFilter);
        this.filterClient(this.xAxisFilter);
      }, error => {
        console.log(error);
      })
  }

  // Legends settings
  protected getStatus(data: Array<ClientRevenueGraphUnit>): void {
    const clientStatus = new Set<string>();
    const status = new Set<string>();
    if (this.tag === ReportTags.CLIENT_REVENUE) {
      status.add('Expected Revenue')
      status.add('Actual Revenue')
      //console.log(status)
    }
    else {
      data.forEach((el: ClientRevenueGraphUnit) => {
        status.add(el['client_name_value']);
      });
    }
    this.allStages = Array.from(status);
    /*
    if(this.label_name==='month'){
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
     else{
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
   }*/
    this.data = data;
    this.xAxisFilterArray = this.getAllXAxisLabel();
    this.filterClient(this.xAxisFilter);
  }

  // To get all X-axis Labels
  protected getAllXAxisLabel(): Array<string> {
    const clients = new Set<Label>();
    if (this.tag === ReportTags.CLIENT_REVENUE && this.label_name === "client_name_value") {
      // console.log("Inside")
      this.data.forEach((el) => {
        //console.log(el)
        clients.add(el[this.label_name]);
      });
      //console.log(clients)
    }
    /* else if(this.tag === ReportTags.CLIENT_REVENUE && this.label_name==="client_name_value"){
      this.data.forEach(el => {
        if(parseFloat(el['client_name_value'])>0){
          clients.add(el[this.label_name]);
          //console.log(clients)
        }
      });
    } */
    else {
      this.data.forEach((el: ClientRevenueGraphUnit) => {
        clients.add(el[this.label_name]);
      });
    }
    return Array.from(clients) as Array<string>;
  }


  // For Client filter
  filterClient(client: string): void {
    this.isCompleted = false;
    if (client === 'ALL') {
      this.chartLabels = Array.from(this.getAllXAxisLabel());
      this.tabularData;
    } else {
      this.chartLabels = [client];
    }
    this.resetChartData();
    this.filterData(this.data);
  }

  //To Filter Chart Data

  protected filterData(data: Array<any>): void {
    this.isCompleted = false;
    this.chartData.forEach((status) => {
      status.wholeDataSet = [];
      this.chartLabels.forEach((name) => {
        var el;

        if (this.tag === ReportTags.CLIENT_REVENUE) {

          if (this.label_name === 'client_name_value') {
            (this.clientName === 'ALL') ?
              el = data.find(el => { return (el[this.label_name] === name) }) :
              el = data.find(el => { return (el[this.label_name] === name && el['client_name_value'] === this.clientName) })
            // console.log(el)
          }
          else {
            //(this.clientName==='ALL')?
            el = data.find(el => el[this.label_name] === name)
            console.log(el)
            // el = data.find(el => (el[this.label_name]) === name && "Actual Revenue" === status.label):
            //  el = data.find(el => (el[this.label_name]) === name && "Actual Revenue"=== status.label && el['client_name_value'][0]===this.clientName)
          }
        }
        else { el = data.find(el => el[this.label_name] === name && el['actual_revenue'] === status.label) }

        if (el) {
          console.log(this.chartData)
          if (this.tag === ReportTags.CLIENT_REVENUE) {
            (status.label === "Expected Revenue") ?
              status.data.push(parseFloat(el['expected_revenue'])) :
              status.data.push(parseFloat(el['actual_revenue']))
            // console.log(status.data)
          }
        }
        else {
          status.data.push(0);
        }
      });
    });
    this.isCompleted = true;
  }

  //Page size function
  onPageSizeChanged() {
    var value = (document.getElementById('page-size') as HTMLSelectElement).value
    this.gridApi.paginationSetPageSize(Number(value));
    this.sizeToFit();
  }

  // Tabular Data Functions
  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.sizeToFit()
  }

  // To fit grid ontainer with column if there are lesser columns
  sizeToFit() {
    this.gridApi.sizeColumnsToFit();
  }

  //To Filter the Tabular Data
  filterOnTable(client: string) {
    this.tabularDataForFilter = this.tabularData;
    if (client === 'ALL') {
      this.tabularDataForFilter = this.tabularData;
    }
    else {
      this.tabularDataForFilter = this.tabularData.filter(_ => {
        if (client === _.client_name_value) {
          // console.log(_)
          return _;
        }
      })
    }
  }

  //Columns definitons for agGrid
  columnDefs = [
    { headerName: "Client Name", field: "client_name_value", sortable: true, filter: true },
    { headerName: "Client Country", field: "country", sortable: true, filter: true },
    { headerName: "Expected Revenue", field: "expected_revenue", sortable: true, filter: true },
    { headerName: "Actual Revenue", field: "actual_revenue", sortable: true, filter: true },
  ];

}

interface CustomizedDataSet extends ChartDataSets {
  wholeDataSet: Array<any>;
  tag?: string
}






