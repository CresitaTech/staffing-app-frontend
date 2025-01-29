import { Component, OnInit } from '@angular/core';
import { Constants } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { JobAgingComponent } from '../dashboard/job-aging/job-aging.component';

declare const $: any;

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.scss']
})

export class AdministrationComponent implements OnInit {

  job = {} as Job;
  constants = Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;
  jobs = [];
  response: any;

  constructor(
    private _api: APIProviderService<Job>,
  ) { }

  ngOnInit(): void {
    this.job.country = "",
      this.job.name = "",
      this.getJobDetails()
  }

  getJobDetails() {
    this.subscription1$ = this._api.getListAPI(APIPath.GET_JOB_NAMES)
      .subscribe((res: any) => {
        //console.log(res);
        this.jobs = res;
      }, error => {
        console.log(error);
      });
  }

  onSaveJob() {
    //console.log(this.job)
    this.subscription1$ = this._api.createCollectionItem(APIPath.GET_JOB_NAMES, this.job)
      .subscribe((res: any) => {
        //console.log(res)
        this.response = res.message;
      }, error => {
        console.log(error);
      });
  }

}

export interface Job {
  name: string,
  country: string,
}
