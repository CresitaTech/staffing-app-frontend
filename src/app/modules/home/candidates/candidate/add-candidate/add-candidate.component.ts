import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Subscription } from 'rxjs';
import { Constants } from 'src/app/enums/constants.enum';
import { Candidate, JobDescriptions } from 'src/app/models/candidate';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { APIPath } from 'src/app/enums/api-path.enum';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { CustomValidatorService } from 'src/app/services/common/custom-validator.service';
import { NgForm } from '@angular/forms';
import * as moment from 'moment';
import { AlertService } from 'src/app/services/alert/alert.service';


@Component({
  selector: 'app-add-candidate',
  templateUrl: './add-candidate.component.html',
  styleUrls: ['./add-candidate.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]

})
export class AddCandidateComponent implements OnInit {

  candidate = { remarks: '' } as Candidate;
  mobNumberPattern = "^((\\+91-?)|0)?[0-9]{10}$";
  subscription1$: Subscription;
  subscription2$: Subscription;
  @ViewChild('closebutton') closebutton;
  constants = Constants;
  private file: any;
  @Output() refreshListEvt = new EventEmitter<any>();
  @Output() closeAddEditPage = new EventEmitter<any>();
  @Input() eventId: string;
  @Input() indexAsInput: string;
  formData = new FormData();
  @Input() action;
  fileName
  resumeName;
  currencyTag: string;
  @ViewChild("inp") inp: HTMLInputElement;
  @ViewChild("inp2") inp2: HTMLInputElement;
  isFileUploaded: boolean = false;
  job_descriptions: Array<JobDescriptions> = [];
  date = moment(new Date()).format('YYYY-MM-DD');
  public countries: any;
  reviewStatusData = true;
  uploads = ['driving_license', 'offer_letter', 'passport', 'rtr', 'salary_slip', 'visa_copy', 'i94_document', 'educational_document', 'additional_qualification_doc', 'certification_doc']
  // this.formData.delete('job_description');
  //  this.formData.delete('driving_license');
  //  this.formData.delete('offer_letter');
  //  this.formData.delete('passport');
  //this.formData.delete('rtr');
  //  this.formData.delete('salary_slip');
  //  this.formData.delete('visa_copy');
  //  this.formData.delete('i94_document');
  //   this.formData.delete('educational_document');


  constructor(
    public service: APIProviderService<Candidate>,
    public activeModal: NgbActiveModal,
    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>,
    public customValidator: CustomValidatorService,
    public alert: AlertService,
    private _api: APIProviderService<Candidate>,
  ) {
    this.initialise();
    this.candidate.notes = " ";
    this.candidate.remarks = " ";
    this.candidate.resume_raw_data = " ";
    this.candidate.submission_date = this.date;
    this.candidate.send_out_date = this.date;
    this.candidate.currency = "NULL"
    this.currencyTag = "$"
  }

  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };

  ngOnInit(): void {
    this.isFileUploaded = false;
    this.candidate.isSalary = 'Yes';
    this.selectSalaryRateFlag = true
    this.candidate.engagement_type = 'W2';
    this.initialise();

    console.log('add oninit: ' + this.eventId)
    this.getCountriesList();

  }

  getCountriesList(): void {
    this._api.getListAPI(APIPath.COUNTRIES).subscribe(res => {
      this.countries = res;
      var userCountry = sessionStorage.getItem(Constants.USER_COUNTRY);
      if(this.eventId===this.constants.ADD || this.eventId===this.constants.POP_UP){
      this.candidate.country = userCountry;
      if(userCountry == "India"){
      this.candidate.currency = "INR";
      this.currencyTag = "₹"
      } else if(userCountry == "US" || userCountry == "United States of America"){
        this.candidate.currency = "USD";
        this.currencyTag = "$"
        }
      }

    
    })
  }


  ngOnChanges() {
    this.initialise();

  }

  initialise() {
    if (this.indexAsInput !== undefined){
      this.getCandidateById(this.indexAsInput);
    }
  }

  ngAfterViewInit(): void {
  }

  setCurrency(event){
    console.log(event.target.value)
    console.log(event.target.value=='INR')
    if(event.target.value==='INR'){
      this.currencyTag = "₹"
    }else{
      this.currencyTag = "$"
    }
  }



  getCandidateById(index): any {
    const request = [
      this.service.getCollectionItemById(APIPath.CANDIDATE, index),
      this.service.getCollectionItemByCandidateId(APIPath.GET_CANDIDATE_JOB_STAGES, index),
      this.service.getCollectionItemByCandidateId(APIPath.REPO_BY_CANDIDATE_ID, index)
    ]
    forkJoin(request).subscribe((res: Array<any>) => {
      this.candidate = res[0];

      if(this.candidate.currency === "INR"){
       
        this.currencyTag = "₹"
        } else {
         
          this.currencyTag = "$"
          }
        
      // console.log(res[2][0]);

      this.candidate.passport = res[2][0].passport ? res[2][0].passport : '--';
      this.candidate.offer_letter = res[2][0].offer_letter ? res[2][0].offer_letter : '--';
      this.candidate.driving_license = res[2][0].driving_license ? res[2][0].driving_license : '--';
      this.candidate.salary_slip = res[2][0].salary_slip ? res[2][0].salary_slip : '--';
      this.candidate.rtr = res[2][0].rtr ? res[2][0].rtr : '--';
      this.candidate.i94_document = res[2][0].i94_document ? res[2][0].i94_document : '--';
      this.candidate.visa_copy = res[2][0].visa_copy ? res[2][0].visa_copy : '--';
      this.candidate.educational_document = res[2][0].educational_document ? res[2][0].educational_document : '--';
      this.candidate.certification_doc = res[2][0].certification_doc ? res[2][0].certification_doc : '--';
      this.candidate.additional_qualification_doc = res[2][0].additional_qualification_doc ? res[2][0].additional_qualification_doc : '--';
      if (this.candidate.min_salary != 0.00 || this.candidate.max_salary != 0.00) {
        this.candidate.isSalary = "Yes";
        this.selectSalaryRateFlag = true;
      }
      else {
        this.candidate.isSalary = "No";
        this.selectSalaryRateFlag = false;
      }


      if (this.candidate.max_salary == 0.00)
        this.candidate.max_salary = null;
      else if (this.candidate.min_salary == 0.00)
        this.candidate.min_salary = null;
      else if (this.candidate.min_rate == 0.00)
        this.candidate.min_rate = null;
      else if (this.candidate.max_rate == 0.00)
        this.candidate.max_rate = null;
      res[1].forEach(_ => {

        _.jd_name = _.job_description.client_name.company_name + "-" + _.job_description.job_title;
        _.stage_name = _.stage.stage_name;
        _.display_date = moment(_.submission_date).format('YYYY-MM-DD');
      })
      this.job_descriptions = res[1];
      console.log(this.candidate.country)


    }, err => {
      console.log(err.message);
    })


  }

  onEdit() {
    this.appendResumeToCandidate();
    this.formData.append('stage', this.constants.DEFAULT_STAGE);
    if (this.formData.get('driving_license') === '--') {
      this.formData.delete('driving_license');
    }
    if (this.formData.get('offer_letter') === '--') {
      this.formData.delete('offer_letter');
    }
    if (this.formData.get('passport') === '--') {
      this.formData.delete('passport');
    }
    if (this.formData.get('rtr') === '--') {
      this.formData.delete('rtr');
    }
    if (this.formData.get('certification_doc') === '--') {
      this.formData.delete('certification_doc');
    }
    if (this.formData.get('additional_qualification_doc') === '--') {
      this.formData.delete('additional_qualification_doc');
    }
    if (this.formData.get('visa_copy') === '--') {
      this.formData.delete('visa_copy');
    }
    if (this.formData.get('i94_document') === '--') {
      this.formData.delete('i94_document');
    }
    if (this.formData.get('salary_slip') === '--') {
      this.formData.delete('salary_slip');
    }
    if (this.formData.get('educational_document') === '--') {
      this.formData.delete('educational_document');
    }
    // this.formData.delete('job_description');
    //  this.formData.delete('driving_license');
    //  this.formData.delete('offer_letter');
    //  this.formData.delete('passport');
    //this.formData.delete('rtr');
    //  this.formData.delete('salary_slip');
    //  this.formData.delete('visa_copy');
    //  this.formData.delete('i94_document');
    //   this.formData.delete('educational_document');

    this.subscription2$ = this.service.patchCollectionItemById
      (APIPath.CANDIDATE, this.indexAsInput, this.formData).subscribe((res) => {
        this.refreshOnModifyOrAdd();
      })
    // this.refreshOnModifyOrAdd();
  }


  readFile(event, keyName: string) {
    this.file = (<HTMLInputElement>event.target).files[0];
    this.formData.append(keyName, this.file);
  }

  appendResumeToCandidate() {
    const keys = Object.keys(this.candidate);
    console.log(keys)
    // this.formData = new FormData();
    keys.forEach(k => {
      if (this.candidate[k] && k !== 'resume' && k !== 'driving_license' && k !== 'salary_slip' && k !== 'visa_copy' && k !== 'i94_document' && k !== 'rtr' && k !== 'educational_document' && k !== 'additional_qualification_doc' && k !== 'certification_doc' && k !== 'offer_letter' && k !== 'passport') {
        if (k !== 'stage' && !this.formData.has(k)) {
          //console.log(k+"-"+ this.candidate[k])
          if ((k == 'max_salary' || k == 'min_salary' || k == 'max_rate' || k == 'min_rate') &&
            (this.candidate[k] === null || !this.candidate[k])) { this.formData.append(k, "0.00"); }
          //  else if(k=='job_description'){
          //   this.candidate[k].forEach(element => {
          //     this.formData.append(k,element);
          //   });     keys = Object.keys(this.candidate);

          // }

          else
            this.formData.append(k, this.candidate[k]);

        }
      }
      // if (this.eventId === Constants.EDIT || this.eventId === Constants.EDIT_POP_UP) {
      //   if (this.file) {
      //     if (k === 'resume') {
      //       this.formData.append('resume', this.file);
      //     }
      // if (k === 'driving_license') {
      //   console.log('driving')
      //   this.formData.append('driving_license', this.file);
      // }
      // if (k === 'offer_letter') {
      //   this.formData.append('offer_letter', this.file);
      // }
      // if (k === 'passport') {
      //   this.formData.append('passport', this.file);
      // }
      // if (k === 'rtr') {
      //   this.formData.append('rtr', this.file);
      // }
      // if (k === 'salary_slip') {
      //   this.formData.append('salary_slip', this.file);
      // }
      // if (k === 'visa_copy') {
      //   this.formData.append('visa_copy', this.file);
      // }
      // if (k === 'i94_document') {
      //   this.formData.append('i94_document', this.file);
      // }
      // if (k === 'educational_document') {
      //   this.formData.append('educational_document', this.file);
      // }
      // if (k === 'certification_doc') {
      //   this.formData.append('certification_doc', this.file);
      // }
      // if (k === 'additional_qualification_doc') {
      //   this.formData.append('additional_qualification_doc', this.file);
      // }

      // }
      // }

    })

    // else
    // this.formData.append('resume', this.file);
    // if (this.eventId === Constants.EDIT || this.eventId === Constants.EDIT_POP_UP && this.uploads.includes(k)) {
    //   if (this.file) {
    //     this.formData.append(k, this.file);
    //   }
    // }
    // if (this.eventId === Constants.EDIT || this.eventId === Constants.EDIT_POP_UP) {
    //   if (this.file) {
    //     this.formData.append('resume', this.file);
    //   }
    // }
    if (this.candidate.stage === undefined || this.candidate.stage === null) {
      this.formData.append('stage', this.constants.DEFAULT_STAGE);

    }
  }


  onSubmit() {
    this.appendResumeToCandidate();
    console.log(this.candidate)

    if (this.job_descriptions.length > 0) {
      this.formData.append("job_descriptions", JSON.stringify(this.job_descriptions));
    }
    else {
      if ((this.candidate.job_description !== null && this.candidate.job_description !== undefined)
        && (this.candidate.stage !== null && this.candidate.stage !== undefined)) {
        this.addJob();
        this.formData.append("job_descriptions", JSON.stringify(this.job_descriptions));
        //console.log(this.job_descriptions)
      }
      else {
        this.formData.append("job_descriptions", "");
      }
    }

    this.formData.append('stage', this.constants.DEFAULT_STAGE);
    this.subscription1$ = this.service.createCollectionItem(APIPath.CANDIDATE, this.formData)
      .subscribe((res: any) => {
        this.refreshOnModifyOrAdd();
      },
      err => {
        this.refreshOnModifyOrAdd(true);
        console.log(err)
      }
      );

  }

  refreshOnModifyOrAdd(isError: Boolean = false) {
    console.log("isError");
    console.log(isError);
    // if(!isError){
    this.formData = new FormData();
    this.candidate = {} as Candidate;
    this.clearCandidateJobFields();
    this.job_descriptions = [];

    //  window.location.reload();
    this.refreshListEvt.emit(null);
    if (this.eventId === Constants.POP_UP || this.eventId === Constants.EDIT_POP_UP) {
      this.closebutton.nativeElement.click();

    }else if(this.eventId === Constants.ADD){
      this.closeClient();
    }
  // }else{
  //   var userCountry = sessionStorage.getItem(Constants.USER_COUNTRY);

  //   if(this.eventId===this.constants.ADD || this.eventId===this.constants.POP_UP){
  //   this.candidate.country = userCountry;
  //   this.job_descriptions = [];
  //   }
  // }
  }

  ngOnDestroy() {
    if (this.subscription1$) this.subscription1$.unsubscribe();
    if (this.subscription2$) this.subscription2$.unsubscribe();
  }

  // readFile(event) {
  //   this.isFileUploaded=true;
  //   this.file = (<HTMLInputElement>event.target).files[0];
  //  // console.log(this.file);
  // }

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }

  selectSalaryRateFlag: boolean;


  selectSalaryOrRate(evt: string) {
    if (evt === 'salary') {
      this.selectSalaryRateFlag = true;
      this.candidate.isSalary = "Yes";
      this.candidate.max_rate = null;
      this.candidate.min_rate = null;
    }
    else if (evt === 'rate') {
      this.selectSalaryRateFlag = false;
      this.candidate.isSalary = "No";
      this.candidate.max_salary = null;
      this.candidate.min_salary = null;

    }
  }

  phoneNumberRef(event, element: HTMLInputElement, form: NgForm) {
    this.customValidator.phoneNumberFormat(event, element, form);
  }

  preventEnter(event, formController) {
    this.customValidator.preventEnter(event, formController);
  }

  closeClient() {
    this.closeAddEditPage.emit(null);
  }



  addJobToArray() {

    if ((this.candidate.job_description !== null && this.candidate.job_description !== undefined) &&
      (this.candidate.stage !== null && this.candidate.stage !== undefined)) {

      if (this.job_descriptions.length > 0) {
        this.job_descriptions.forEach(_ => {
          if (this.candidate.job_description === _.job) {
            var message = "You are trying to add an existing job description, for the same candidate again.";
            this.alert.error(message, this.options);
            this.clearCandidateJobFields();
          }
        })
      }
      if (this.candidate.job_description !== null && this.candidate.job_description !== undefined) {
        this.addJob();
        this.clearCandidateJobFields();
      }
    }
    else if ((this.candidate.job_description === null || this.candidate.job_description === undefined) &&
      (this.candidate.stage !== null && this.candidate.stage !== undefined)) {
      var message = "Job description field can not be empty. Please put a valid entry.";
      this.alert.error(message, this.options);
    }
    else if ((this.candidate.job_description !== null && this.candidate.job_description !== undefined) &&
      (this.candidate.stage === null || this.candidate.stage === undefined)) {
      var message = "Status field can not be empty. Please put a valid entry.";
      this.alert.error(message, this.options);
    }
    else {
      var message = "You are trying to add an empty form.Please fill the required entries.";
      this.alert.error(message, this.options);
    }
  }


  addJob() {
    if (this.candidate.submission_date === undefined || this.candidate.submission_date === null) {
      this.candidate.submission_date = moment(new Date()).format('YYYY-MM-DD');
    }

    var temp = {} as JobDescriptions | any;
    temp.job = this.candidate.job_description;
    temp.jd_name = this.candidate.jd_name[0].client_name + "-" + this.candidate.jd_name[0].job_title;

    if (this.candidate.stage === Constants.DEFAULT_STAGE)
      temp.stage_name = "Candidate Added";
    else
      temp.stage_name = this.candidate.stage_name[0].stage_name;
    // var timestamp = new Date().toISOString().split("T")[1];
    //  console.log(moment(this.candidate.submission_date).format('YYYY-MM-DD') + "T" + timestamp)
    temp.status = this.candidate.stage;
    temp.submission_date = moment(this.candidate.submission_date).format('YYYY-MM-DD')// + "T" + timestamp;
    if (this.candidate.stage === Constants.SEND_OUT) {
      if (this.candidate.send_out_date === undefined || this.candidate.send_out_date === null)
        temp.send_out_date = moment(new Date()).format('YYYY-MM-DD');

      else
        temp.send_out_date = moment(this.candidate.send_out_date).format('YYYY-MM-DD') //+ "T" + timestamp;

    }
    else
      temp.send_out_date = "";

    temp.display_date = this.candidate.submission_date;
    temp.notes = this.candidate.notes;
    temp.remarks = this.candidate.remarks;
    //console.log(temp)
    this.job_descriptions.push(temp);
  }


  clearCandidateJobFields() {
    this.candidate.job_description = null;
    this.candidate.stage = Constants.DEFAULT_STAGE;
    this.candidate.submission_date = this.date;
    this.candidate.send_out_date = this.date;
    this.candidate.stage_name = null;
    this.candidate.jd_name = null;
    this.candidate.notes = "";
    this.candidate.remarks = "";
    this.candidate.resume_raw_data = "";
  }

  isSubmission(){
    if(!this.job_descriptions || this.job_descriptions.length === 0)
    return false;
  

    for(var i = 0; i < this.job_descriptions.length; i ++){
      // console.log(this.job_descriptions[i].status);
      // console.log(this.job_descriptions[i].stage_name);
      if ((this.job_descriptions[i].status && this.job_descriptions[i].status !== undefined && this.job_descriptions[i].status !== Constants.DEFAULT_STAGE) || (this.job_descriptions[i].stage_name && this.job_descriptions[i].stage_name !== "Candidate Added")) {
        // console.log(this.job_descriptions[i].status);
        return true;
       }
    }

   
  }


  deleteJob(id: string) {
    this.job_descriptions = this.job_descriptions.filter(_ => {
      if (id !== _.job)
        return _;
    })
  }


}
