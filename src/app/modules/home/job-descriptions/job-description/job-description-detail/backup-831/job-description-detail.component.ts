import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { APIPath } from 'src/app/enums/api-path.enum';
import { JobDescription, JobDescriptionModel } from 'src/app/models/job-description';
import { APIProviderService } from 'src/app/services/api-provider.service';
import * as moment from 'moment';
import { Constants } from 'src/app/enums/constants.enum';
import { JobMatchCandidatesComponent } from '../job-match-candidates/job-match-candidates.component';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' }

@Component({
  selector: 'app-job-description-detail',
  templateUrl: './job-description-detail.component.html',
  styleUrls: ['./job-description-detail.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class JobDescriptionDetailComponent implements OnInit, OnDestroy {

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
  currencyTag: string;
  canInactivate=true;
  reviewError
  totalJobs;
  bdmShortName;

  constructor(
    public activeModal: NgbActiveModal,
    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>,
    public modalService: NgbModal,
    private _api: APIProviderService<JobDescription>,
  ) {
    this.job_description.roles_and_responsibilities = '';
    this.job_description.job_description = '';
    this.job_description.status = 'Active';
    // this.job_description.country = '';
    this.job_description.currency = "NULL"
    this.currencyTag = "$"
  }

  ngOnInit(): void {


    this.bdmShortName = localStorage.getItem('bdmShortName')

    this.initialise();
    this.getCountriesList();
  }

  onChange(event){
    console.log(event);
    if(event === "Inactive" && this.indexAsInput != undefined){
    this._api.getListAPI(APIPath.GET_JOB_CURRENT_STATUS+"?job_id="+this.indexAsInput)
      .subscribe((res:any)=>{
      
        if(res && res.status==="error"){
          this.canInactivate = false;
          this.reviewError = res.message;
        }else{
          this.canInactivate = true;
        }
      }, err => {
        this.canInactivate = true;
        console.log(err.message);
        this.reviewError = null;
      })
    }else{
      this.reviewError = null;
      this.canInactivate = true;
    }
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
      var year = date.split("-")[0];
      var month = date.split("-")[1];
      var furtherSplit = date.split("-")[2].split(":")[0];
      var getTime = date.split("-")[2].split(":")[1];
      var getfurtherTime = date.split("-")[2].split(":")[1].split(".")[0];
      var createdDate = moment(new Date()).format('YYYYMMDDhhmmss');

      this._api.getListAPI(APIPath.GET_DASHBOARD_SUMMARY)
      .subscribe((res:any)=>{
        this.totalJobs = res.total_jobs
        console.log(localStorage.getItem('bdmShortName'))
        console.log('Calculate Total jobs: ' + this.totalJobs)
        this.job_description.job_id = 'OPJDID' + this.bdmShortName  + createdDate + this.totalJobs;
        //console.log('this.job_description.job_id: ' + this.job_description.job_id)
      });


      //this.job_description.job_id = 'OPJDID' + year + month + furtherSplit + getTime + getfurtherTime;
    }
    //this.job_description.job_id= 'OP-JDID'
    //`OP-JDID${m.year()}${m.month() + 1}${m.date()}_${m.minute}${m.seconds}`

  }

  ngAfterViewInit(): void {
  }


  setCurrency(event){
    console.log(event.target.value)
    if(event.target.value=='INR'){
      this.currencyTag = "₹"
    }else{
      this.currencyTag = "$"
    }
  }



  getCountriesList(): void {
    this._api.getListAPI(APIPath.COUNTRIES).subscribe(res => {
      this.countries = res;
     
      var userCountry = sessionStorage.getItem(Constants.USER_COUNTRY);
      if(this.eventId===this.constants.ADD || this.eventId===this.constants.POP_UP ){
      this.job_description.country = userCountry;
      if(userCountry == "India"){
        this.job_description.currency = "INR";
        this.currencyTag = "₹"
        } else if(userCountry == "US" || userCountry == "United States of America"){
          this.job_description.currency = "USD";
          this.currencyTag = "$"
          }
      }

      console.log( "this.job_description.country")
      console.log( this.job_description.country)
    })
  }

  getJobDescriptionById(index): any {
    this._api.getCollectionItemById(APIPath.JOB_DESCRIPTION, index)
      .subscribe((res) => {
        this.job_description = res;
        if (this.job_description.min_salary != null || this.job_description.max_salary != null) {
          this.job_description.isSalary = "Yes";
          this.selectSalaryRateFlag = true;
        }
        else {
          this.job_description.isSalary = "No";
          this.selectSalaryRateFlag = false;
        }

        if(this.job_description.currency=='INR'){
          this.currencyTag = "₹"
        }else{
          this.currencyTag = "$"
        }

        //     if(this.job_description.min_salary==="0.00"){
        //       this.job_description.min_salary=null;
        //       this.job_description.max_salary=null;

        //     }
        //    if(this.job_description.min_rate==="0.00"){
        //   this.job_description.min_rate=null;
        //   this.job_description.max_rate=null;
        //  }
      }, err => {
        // TODO: handle error here
        console.log(err.message);
      })
  }

  onEdit() {
    this.job_description.job_pdf = null;
    this.job_description.job_recruiter_pdf = null;

    if (!this.job_description.priority) {
      this.job_description.priority = false;
    }
    if (this.job_description.min_salary === undefined || !this.job_description.min_salary) {
      this.job_description.min_salary = null;
    }
    if (this.job_description.max_salary === undefined || !this.job_description.max_salary) {
      this.job_description.max_salary = null;
    }
    if (this.job_description.min_rate === undefined || !this.job_description.min_rate) {
      this.job_description.min_rate = null;
    }
    if (this.job_description.max_rate === undefined || !this.job_description.max_rate) {
      this.job_description.max_rate = null;
    }
    if (this.job_description.min_years_of_experience === undefined || !this.job_description.min_years_of_experience) {
      this.job_description.min_years_of_experience = null;
    }
    if (this.job_description.max_years_of_experience === undefined || !this.job_description.max_years_of_experience) {
      this.job_description.max_years_of_experience = null;
    }

    if (this.job_description.min_client_rate === undefined || !this.job_description.min_client_rate) {
      this.job_description.min_client_rate = null;
    }
    if (this.job_description.max_client_rate === undefined || !this.job_description.max_client_rate) {
      this.job_description.max_client_rate = null;
    }

    if (this.job_description.job_posted_date === null || this.job_description.job_posted_date === undefined) {
      this.job_description.job_posted_date = moment(new Date()).format('YYYY-MM-DD');;
    }


    this.subscription2$ = this._api.patchCollectionItemById(APIPath.JOB_DESCRIPTION, this.indexAsInput, this.job_description)
      .subscribe((res) => {
        this.refreshOnModifyOrAdd();
      },
      err => {
        this.refreshOnModifyOrAdd(true);
        console.log(err)
      }
      );
  }


  onSubmit() {

    if (!this.job_description.priority) {
      this.job_description.priority = false;
    }


    if (this.job_description.min_salary === undefined || !this.job_description.min_salary) {
      this.job_description.min_salary = null;
    }
    if (this.job_description.max_salary === undefined || !this.job_description.max_salary) {
      this.job_description.max_salary = null;
    }
    if (this.job_description.min_rate === undefined || !this.job_description.min_rate) {
      this.job_description.min_rate = null;
    }
    if (this.job_description.max_rate === undefined || !this.job_description.max_rate) {
      this.job_description.max_rate = null;
    }
    if (this.job_description.min_years_of_experience === undefined || !this.job_description.min_years_of_experience) {
      this.job_description.min_years_of_experience = null;
    }
    if (this.job_description.max_years_of_experience === undefined || !this.job_description.max_years_of_experience) {
      this.job_description.max_years_of_experience = null;
    }

    if (this.job_description.min_client_rate === undefined || !this.job_description.min_client_rate) {
      this.job_description.min_client_rate = null;
    }
    if (this.job_description.max_client_rate === undefined || !this.job_description.max_client_rate) {
      this.job_description.max_client_rate = null;
    }

    if (this.job_description.job_posted_date === null || this.job_description.job_posted_date === undefined) {
      this.job_description.job_posted_date = moment(new Date()).format('YYYY-MM-DD');;
    }

    this.subscription1$ = this._api.createCollectionItem(APIPath.JOB_DESCRIPTION, this.job_description)
      .subscribe((res: any) => {
        console.log(this.job_description)
        this.refreshOnModifyOrAdd();
        this.openMatchedCandidatesOnJobModel(res)

      },
      err => {
        this.refreshOnModifyOrAdd(true);
        console.log(err)
      }
      );
  }

  openMatchedCandidatesOnJobModel(jd){
    console.log("jd: " + JSON.stringify(jd))
    let modalRef;
    modalRef = this.modalService.open(JobMatchCandidatesComponent, _NgbModalOptions);
    modalRef.componentInstance.job_id = jd.id;
    modalRef.componentInstance.job_description = jd;
  }

  refreshOnModifyOrAdd(isError: Boolean = false) {
    this.job_description = {} as JobDescription;
    this.refreshListEvt.emit(null);
    if (this.isPopup) {
      this.closebutton.nativeElement.click();
    }else{
     
      this.closeClient();
    }
  }
  closeClient() {
    this.closeAddEditPage.emit(null);
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
