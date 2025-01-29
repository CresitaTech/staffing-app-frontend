import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { vendor } from 'src/app/models/vendor';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { Paging } from 'src/app/classes/paging';
import { CustomFilterInterface } from 'src/app/models/filters';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { FilterComponent } from 'src/app/components/filter/filter.component';
// import { EmailImportComponent } from './email-import/vendor-import.component';
import { CreateEmailListComponent } from './create-email-list/create-email-list.component';
import { Router } from '@angular/router';
import * as Chart from 'chart.js';
const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false };
import { DatePipe, formatDate } from '@angular/common';

@Component({
  selector: 'app-campaign',
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss']
})
export class CampaignComponent
  implements OnInit, OnDestroy, AfterViewInit {

  api_path = APIPath.VENDORS;

  @ViewChild('lineCanvas') lineCanvas: ElementRef;
  lineChart: any;

  myDate = new Date();
  dashData: any;

  constructor(
    service: APIProviderService<vendor>,
    private router: Router,
    selectAllService: SelectAllService,
    private modalService: NgbModal,
    private _api: APIProviderService<any>,
  ) {
    // super(service, selectAllService);
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

  }
  ngAfterViewInit(): void {
    this.lineChartMethod();
  }

  ngOnInit(): void {
    this.getInitialData();
  }

  ngOnDestroy(): void {

  }
  lineChartMethod() {
    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.Last7Days(),
        datasets: [
          {
            label: 'Sent',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,192,192,0.4)',
            borderColor: 'rgba(255, 149, 10)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(255, 149, 10)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(255, 149, 10)',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [65, 59, 80, 81, 56, 55, 40, 10, 5, 50, 10, 15],
            spanGaps: false,
          },
          {
            label: 'Delivered',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,195,192,0.4)',
            borderColor: 'rgba(23, 204, 23)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(23, 204, 23)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(23, 204, 23)',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [44, 26, 77, 30, 44, 77, 22, 98, 15, 3, 55, 66],
            spanGaps: false,
          },
          {
            label: 'Spam',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,195,192,0.4)',
            borderColor: 'rgba(255, 111, 116)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(255, 111, 116)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(255, 111, 116)',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [66, 77, 77, 30, 22, 33, 78, 98, 44, 63, 11, 45],
            spanGaps: false,
          },
          {
            label: 'Bounce',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,195,192,0.4)',
            borderColor: 'rgba(51, 122, 183)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(51, 122, 183)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(51, 122, 183)',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [88, 55, 11, 55, 44, 44, 22, 98, 2, 3, 33, 44],
            spanGaps: false,
          }
        ]
      }
    });
  }

  

  Last7Days() {
    var result = [];
    for (var i = 0; i < 8; i++) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      result.push(formatDate(d, 'dd MMM', 'en-US'))
    }

    return result.reverse();
  }

  getInitialData(){
    this._api.getListAPI(APIPath.CAMPAIGN_DASHBOARD).subscribe((res: any) => {
     console.log(res);
     if(res && res.results && res.results.length > 0){
     this.dashData = res.results[res.results.length - 1]
     }
    })
  }

}
