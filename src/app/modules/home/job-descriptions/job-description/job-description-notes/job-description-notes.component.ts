import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { APIPath } from 'src/app/enums/api-path.enum';
import { JobDescription, JobDescriptionModel } from 'src/app/models/job-description';
import { APIProviderService } from 'src/app/services/api-provider.service';
import * as moment from 'moment';
import { Constants } from 'src/app/enums/constants.enum';

@Component({
  selector: 'app-job-description-notes',
  templateUrl: './job-description-notes.component.html',
  styleUrls: ['./job-description-notes.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class JobDescriptionNotesComponent implements OnInit, OnDestroy {

  job_description = {} as JobDescription;
  subscription1$: Subscription;
  subscription2$: Subscription;
  job_posted_date: string = moment(new Date()).format('YYYY-MM-DD');;
  public countries: any;

  private file: any;
  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() eventId: string;
  @Input() indexAsInput: string;
  @Input() isPopup: boolean;
  @Input() current_job_id?: string;
  @Output() closeAddEditPage = new EventEmitter<any>();
  @ViewChild('closebutton') closebutton;
  @Input() action;
  constants = Constants;
  
  totalJobs;
  bdmShortName;

  constructor(
    public activeModal: NgbActiveModal,
    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>,
    private _api: APIProviderService<JobDescription>,
  ) {
    this.job_description.roles_and_responsibilities = '';
    this.job_description.job_description = '';
    this.job_description.status = 'Active';
    this.job_description.country = '';
  }

  ngOnInit(): void {

   
    this.bdmShortName = localStorage.getItem('bdmShortName')

    this.initialise();
  }


  ngOnChanges() {
    this.initialise();
    this.getCountriesList();
  }

  initialise() {
    if (this.indexAsInput != undefined)
      this.getJobDescriptionById(this.indexAsInput);
    else {
      //   this.job_description.default_assignee=sessionStorage.getItem(Constants.USER_ID);
      this.current_job_id = JobDescriptionModel.getNewJobDescriptionId();
      var date = new Date().toISOString();

      this._api.getListAPI(APIPath.GET_DASHBOARD_SUMMARY)
      .subscribe((res:any)=>{
        this.totalJobs = res.total_jobs
        console.log(localStorage.getItem('bdmShortName'))
        console.log('Calculate Total jobs: ' + this.totalJobs)
        //this.job_description.job_id = 'OPJDID' + this.bdmShortName  + createdDate + this.totalJobs;
        //console.log('this.job_description.job_id: ' + this.job_description.job_id)
      });

      
      //this.job_description.job_id = 'OPJDID' + year + month + furtherSplit + getTime + getfurtherTime;
    }
    //this.job_description.job_id= 'OP-JDID'
    //`OP-JDID${m.year()}${m.month() + 1}${m.date()}_${m.minute}${m.seconds}`

  }

  ngAfterViewInit(): void {
  }

  getCountriesList(): void {
    this._api.getListAPI(APIPath.COUNTRIES).subscribe(res => {
      this.countries = res;
      console.log(this.countries)
    })
  }
  
  getJobDescriptionById(index): any {
    this._api.getCollectionItemById(APIPath.JOB_DESCRIPTION, index)
      .subscribe((res) => {
        this.job_description = res;
        this.job_description.job_id = res.job_id

      }, err => {
        // TODO: handle error here
        console.log(err.message);
      })
  }

  onEdit() {
    this.subscription2$ = this._api.patchCollectionItemById(APIPath.JOB_DESCRIPTION, this.indexAsInput, this.job_description)
      .subscribe((res) => {
        this.refreshOnModifyOrAdd();
      })
  }


  onSubmit() {
    console.log(JSON.stringify(this.job_description))
    this.job_description.job_id = this.job_description.id;
    this.subscription1$ = this._api.createCollectionItem(APIPath.JOB_DESCRIPTION_NOTES, this.job_description)
      .subscribe((res: any) => {
        console.log(this.job_description)
        this.refreshOnModifyOrAdd();
      });
  }


  refreshOnModifyOrAdd() {
    this.job_description = {} as JobDescription;
    this.refreshListEvt.emit(null);
    if (this.isPopup) {
      this.closebutton.nativeElement.click();
    }
  }

  ngOnDestroy() {
    if (this.subscription1$) this.subscription1$.unsubscribe();
    if (this.subscription2$) this.subscription2$.unsubscribe();
  }

  readFile(event) {
    this.file = (<HTMLInputElement>event.target).files[0];
    console.log(this.file);
  }

  closeFunction(refreshPage: boolean): void {
    this.refreshListEvt.emit(refreshPage);
    this.closeAddEditPage.emit(null);
  }

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }

  selectSalaryRateFlag: boolean;


  selectSalaryOrRate(evt: string) {
    if (evt === 'salary') {
      this.selectSalaryRateFlag = true;
      this.job_description.isSalary = "Yes";
      this.job_description.max_rate = null;
      this.job_description.min_rate = null;
      //console.log("called salary")
    }
    else if (evt === 'rate') {
      this.selectSalaryRateFlag = false;
      this.job_description.isSalary = "No";
      //console.log("called rate");
      this.job_description.max_salary = null;
      this.job_description.min_salary = null;

    }
  }

}
