import { DatePipe } from '@angular/common';
import { OnDestroy } from '@angular/core';
import { Component, OnInit, Output, Input, EventEmitter, ViewChild, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { forkJoin, Subscription } from 'rxjs';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Activity } from 'src/app/models/activity';
import { Candidate, JobDescriptions } from 'src/app/models/candidate';
import { Interview } from 'src/app/models/interviews';
import { AlertService } from 'src/app/services/alert/alert.service';

import { APIProviderService } from 'src/app/services/api-provider.service';
import { AddInterviewComponent } from '../../../interviews/interview/add-interview/add-interview.component';
declare const $: any;

@Component({
  selector: 'app-add-activity',
  templateUrl: './add-activity.component.html',
  styleUrls: ['./add-activity.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class AddActivityComponent implements OnInit {

  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;
  @Input() candidate_name;
  @Input() candidate_id: string;
  @Input() job_description;
  @Input() stage: any;

  activity = { notes: '' } as Activity;
  constants = Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;
  subscription3$: Subscription;
  reviewStatusData = true;
  statusFormDisplay = false
  selectSalaryRateFlag = false
  currencyTags: string;
  private file: any;
  formData = new FormData();
  isResumeUpdate = false
  userName: String;
  jd_name: string
  interview = {} as Interview;
  submissionDateError: boolean = false;

  candidate = { remarks: '' } as Candidate;

  @ViewChild("closebutton") closebutton;
  @ViewChild("f") form: NgForm;

  action: string = "add";
  job_descriptions: Array<JobDescriptions | any> = [];
  interviews: Array<any> = [];
  date = moment(new Date()).format('YYYY-MM-DD');
  datePipe: DatePipe = new DatePipe('en-US');

  constructor(
    private _api: APIProviderService<Activity>,
    public activeModal: NgbActiveModal,
    private alert: AlertService,
    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>,
    private modalService: NgbModal,
    public service: APIProviderService<Candidate>,
  ) {
    this.stageid();
    this.activity.submission_date = this.date;
    this.activity.send_out_date = this.date;
    //console.log(this.date)
    this.selectSalaryRateFlag = true
   
  }
  ngOnDestroy(): void {
    // throw new Error('Method not implemented.');
  }

  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };

  ngOnInit(): void {
    this.initialise();
    this.stageid();
    this.getUserLoggedInById();
    this.statusFormDisplay = false
    // this.currencyTag = "$"
    this.candidate.isSalary = "Yes";

    console.log("this.job_description");
    console.log(this.job_description);
    console.log("this.eventId");

    if (this.job_description && this.job_description !== null && this.job_description !== undefined && this.job_description.id) {
      this.activity.job_description = this.job_description.id;
      this.statusFormDisplay = true;
      this.jd_name = this.job_description.client_name.company_name + "-" + this.job_description.job_title
    }
  }

  ngOnChanges(): void {
    this.activity.activity_status = this.stage;
    // console.log(this.activity.activity_status);
    this.initialise();
    console.log('Value candidate_id: ' + this.candidate_id)
  }

  displayStatusForm() {
    this.statusFormDisplay = true;
    this.activity = { notes: '' } as Activity;
    // this.candidate = { notes: '' } as Candidate;
    console.log(this.stage);
    this.activity.activity_status = this.stage;
    this.eventId = Constants.ADD;
    //  // console.log(this.activity.activity_status);
    this.action = "add";
    this.stageid();
    this.activity.submission_date = this.date;
    this.activity.send_out_date = this.date;
    // this.activity.candidate_name  = this.candidate_id;
    //  this.initialise();
    // this.candidate.isSalary = "Yes";
    console.log("displayStatusForm");
  }
  resetTable() {
    this.statusFormDisplay = false;
    this.activity = { notes: '' } as Activity;
  }

  selectSalaryOrRate(evt: string) {
    if (evt === 'salary') {
      this.selectSalaryRateFlag = true;
      this.candidate.isSalary = "Yes";
      // this.candidate.max_rate = null;
      // this.candidate.min_rate = null;
    }
    else if (evt === 'rate') {
      this.selectSalaryRateFlag = false;
      this.candidate.isSalary = "No";
      // this.candidate.max_salary = null;
      // this.candidate.min_salary = null;

    }
  }

  readFile(event, keyName: string) {
    this.file = (<HTMLInputElement>event.target).files[0];
    this.formData.append(keyName, this.file);
    this.isResumeUpdate = true
  }

  stageid() {
    if (this.eventId === Constants.POP_UP) {
      this.activity.activity_status = this.stage;

    }
  }

  createInterview() {
    var modalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false, size: 'lg' }
    var modalRef = this.modalService.open(AddInterviewComponent, modalOptions);
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.candidate_name = this.candidate.first_name;
    modalRef.componentInstance.candidate_id = this.candidate.id;
    modalRef.componentInstance.jobId = this.activity.job_description;
    modalRef.componentInstance.refreshListEvt.subscribe((res) => {
      modalRef.dismiss();
      console.log("refreshListEvt");
      console.log(res);
      this.interview = res;


      this._api.getListAPI(APIPath.INTERVIEWER + '?ordering=-created_at&offset=0').subscribe((res1: any) => {

        if (res1) {
          res1.results.forEach(_ => {
            if (_.id === res.interviewer_name) {
              this._api.getListAPI(APIPath.TIMESLOT).subscribe((res2: any) => {

                if (res2) {
                  res2.results.forEach(valS => {
                    if (valS.id === res.time_slot) {

                      if (res) {

                        this.interviews.splice(0, 0, { jd_attachment: { job_title: this.activity.jd_name }, interviewer_name: { first_name: _.first_name, last_name: _.last_name }, meeting_time: res.meeting_time, time_slot: { time_slot: valS.time_slot } });
                     
                      }
                    }
                  })

                }



              }, error => {
                console.log(error);

              })
            }
          })

        }



      }, error => {
        console.log(error);

      })

    })

    modalRef.result.then(res => {
      console.log("result");
      console.log(res);
    }, error => {
      console.log(error);

    });
  }

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }

  initialise() {
    // if (this.indexAsInput != undefined)
    //   this.getActivityById(this.indexAsInput);
    if (this.indexAsInput !== undefined) {
      this.getCandidateById(this.indexAsInput);
    }
  }

  // detailsOfSelectedCandidate(evt) {
  //   console.log(evt)
  //   // this.activity.activity_status = evt.stage;
  //   this.getActivityById(evt);
  //   this.getCandidateById(evt);
  // }

  // getActivityById(index: string) {
  //   console.log("index: " + index)
  //   this.job_descriptions = [];

  //   this._api.getCollectionItemByCandidateId(APIPath.GET_CANDIDATE_JOB_STAGES, index).subscribe((res: any) => {
  //     //  this.activity = res;
  //     console.log("getActivityById: " + res);
  //     this.candidate_id = index;
  //     res.forEach(_ => {
  //       var temp: any = {};
  //       temp.jd_name = _.job_description.client_name.company_name + "-" + _.job_description.job_title;
  //       temp.stage_name = _.stage.stage_name;
  //       temp.display_date = moment(_.submission_date).format('YYYY-MM-DD');
  //       //console.log(temp.display_date)
  //       temp.job_description = _.job_description.id;
  //       temp.submission_date = _.submission_date;
  //       temp.recruiter_name = _.created_by.first_name + " " + _.created_by.last_name;
  //       temp.stage = _.stage.id;
  //       temp.id = _.id;
  //       temp.candidate_id = _.candidate_name;
  //       temp.notes = _.notes;
  //       temp.send_out_date = _.send_out_date;

  //       temp.min_salary = _.job_description.min_salary;
  //       temp.max_salary = _.job_description.max_salary
  //       temp.min_rate = _.job_description.min_rate;
  //       temp.max_rate = _.job_description.max_rate;

  //       // if(this.activity.job_min_salary!=null ||this.activity.job_max_salary!=null){
  //       //   this.activity.isSalary="Yes";
  //       //   this.selectSalaryRateFlag= true;
  //       //  }
  //       //  else{
  //       //   this.activity.isSalary="No";
  //       //   this.selectSalaryRateFlag= false;
  //       //  }
  //       this.job_descriptions.push(temp);

  //     })
  //   }, error => {
  //     console.log(error);

  //   })
  // }

  getCandidateById(index): any {
    this.job_descriptions = [];
    const request = [
      this.service.getCollectionItemById(APIPath.CANDIDATE, index),
      this.service.getCollectionItemByCandidateId(APIPath.GET_CANDIDATE_JOB_STAGES, index),
      this.service.getCollectionItemByCandidateId(APIPath.REPO_BY_CANDIDATE_ID, index),
      this.service.getCollectionItemByCandidateId(APIPath.CANDIDATE_INTERVIEW_LIST, index),
    ]
    forkJoin(request).subscribe((res: Array<any>) => {
      this.candidate = res[0];
      if(this.candidate.currency === "INR"){
       
        this.currencyTags = "₹"
        } else {
         
          this.currencyTags = "$"
          }
          console.log(this.currencyTags);
      // console.log(res[2][0]);

      // this.candidate.passport = res[2][0].passport ? res[2][0].passport : '--';
      // this.candidate.offer_letter = res[2][0].offer_letter ? res[2][0].offer_letter : '--';
      // this.candidate.driving_license = res[2][0].driving_license ? res[2][0].driving_license : '--';
      // this.candidate.salary_slip = res[2][0].salary_slip ? res[2][0].salary_slip : '--';
      // this.candidate.rtr = res[2][0].rtr ? res[2][0].rtr : '--';
      // this.candidate.i94_document = res[2][0].i94_document ? res[2][0].i94_document : '--';
      // this.candidate.visa_copy = res[2][0].visa_copy ? res[2][0].visa_copy : '--';
      // this.candidate.educational_document = res[2][0].educational_document ? res[2][0].educational_document : '--';
      // this.candidate.certification_doc = res[2][0].certification_doc ? res[2][0].certification_doc : '--';
      // this.candidate.additional_qualification_doc = res[2][0].additional_qualification_doc ? res[2][0].additional_qualification_doc : '--';
      if ((this.candidate.min_salary ) || (this.candidate.max_salary )) {
        this.candidate.isSalary = "Yes";
        this.selectSalaryRateFlag = true;
      }
      else if ((this.candidate.min_rate ) || (this.candidate.max_rate )) {
        this.candidate.isSalary = "No";
        this.selectSalaryRateFlag = false;
      }else{
        this.candidate.isSalary = "Yes";
      }



      if (this.candidate.max_salary)
      this.candidate.max_salary = Number(this.candidate.max_salary);
    else if (this.candidate.min_salary)
    this.candidate.min_salary = Number(this.candidate.min_salary);
    else if (this.candidate.min_rate)
    this.candidate.min_rate = Number(this.candidate.min_rate);
    else if (this.candidate.max_rate)
    this.candidate.max_rate = Number(this.candidate.max_rate);
      console.log(res[1]);
      console.log("Aman ");
      res[1].forEach(_ => {
        _.recruiter_name = _.created_by.first_name + " " + _.created_by.last_name;
        _.jd_name = _.job_description.client_name.company_name + "-" + _.job_description.job_title;
        _.stage_name = _.stage.stage_name;
        _.display_date = moment(this.candidate.created_at).format('YYYY-MM-DD');
        console.log(_.submitted_by + "vishnu");
        if(_.submitted_by === null){
          _.submitted1_by = '-';
          
        }else{
          _.submitted1_by = _.submitted_by.first_name + " " + _.submitted_by.last_name;
        }
        _.submission_date = moment(_.submission_date).format('YYYY-MM-DD');
        _.updated1_by = _.updated_by.first_name + " " + _.updated_by.last_name;
      })
      this.job_descriptions = res[1];
      this.interviews = res[3];
      console.log("this.job_descriptions")
      console.log(this.job_descriptions)


    }, err => {
      console.log(err.message);
    })


  }


  appendResumeToCandidate() {
    const keys = Object.keys(this.candidate);
    console.log("appendResumeToCandidate")
    console.log(keys)
    // this.formData = new FormData();
    keys.forEach(k => {
      if (this.candidate[k] && k !== 'resume' && k !== 'driving_license' && k !== 'salary_slip' && k !== 'visa_copy' && k !== 'i94_document' && k !== 'rtr' && k !== 'educational_document' && k !== 'additional_qualification_doc' && k !== 'certification_doc' && k !== 'offer_letter' && k !== 'passport') {
        if (k !== 'stage' && !this.formData.has(k)) {
          //console.log(k+"-"+ this.candidate[k])
          if ((k == 'max_salary' || k == 'min_salary' || k == 'max_rate' || k == 'min_rate') &&
            (this.candidate[k] === null || !this.candidate[k])) { this.formData.append(k, "0.00"); }
          else
            this.formData.append(k, this.candidate[k]);

        }
      }


    })

    if (this.candidate.stage === undefined || this.candidate.stage === null) {
      this.formData.append('stage', this.constants.DEFAULT_STAGE);
    }
  }


  // onEdit() {
  //   this.subscription2$ = this._api.putCollectionItemById
  //     (APIPath.ACTIVITY, this.indexAsInput, this.activity).subscribe((res) => {
  //       this.refreshOnModifyOrAdd(res);
  //     }, error => {
  //       console.log(error);

  //     })
  // }


  // onSubmit() {
  //   let activity;
  //   if (!this.activity.candidate_name) {
  //     activity = { candidate_name: this.candidate_id, ...this.activity }
  //   } else {
  //     activity = this.activity;
  //   }
  //   this.subscription1$ = this._api.createCollectionItem(APIPath.ACTIVITY, activity)
  //     .subscribe((res: any) => {
  //       this.refreshOnModifyOrAdd(res);
  //     }, error => {
  //       console.log(error);
  //     });
  // }

  refreshOnModifyOrAdd() {
    this.activity = {} as Activity;
    this.candidate = { remarks: '' } as Candidate;
    this.refreshListEvt.emit(null);
    // if (this.eventId === this.constants.POP_UP) {
    //   this.activeModal.close(res);
    // }

    this.initialise();
  }

  addEditButton(action) {
    /// if form is edit then check for edit or add operation
    /// do update state after each add and edit separately
    // console.log("on button clicked");
    // console.log(this.activity.activity_status);
    // console.log("testing");
    // this.job_descriptions.forEach(_ => {
    //   this.id = _.id;
    //   console.log("on button clicked testing");
    // console.log(this.activity.stage_name[0].stage_name);
    // console.log(_.stage_name);
    // console.log("testing testing");
    //   if (action === 'add' && this.activity.job_description === _.job_description.id && this.activity.stage_name[0].stage_name === 'Submission' && _.stage_name !== 'Submission') {
    //     action = 'edit';
    //   }else if(action === 'add' && this.activity.job_description === _.job_description.id && _.stage_name === 'Submission') {
    //     var message = "More than one submission not allowed for same job and same client";
    //     this.alert.error(message, this.options);
    //     this.clearActivityJobFields();
    //     return;
    //   }
    // })
    if (!this.form.pristine) {
      if (action === 'add') {
        this.addJobToArray();
      }
      else if (action === 'edit') {
        this.onEditJob();
      }
    }
    this.activeModal.close();
  }

  addJobToArray() {
    if ((this.activity.job_description !== null && this.activity.job_description !== undefined) &&
      (this.activity.activity_status !== null && this.activity.activity_status !== undefined)) {

      if (this.job_descriptions.length > 0) {

        this.job_descriptions.forEach(_ => {
          console.log(this.activity.job_description);
          console.log(_.job_description.id);
          if (this.activity.job_description === _.job_description.id) {
            var message = "You are trying to add an existing job description, for the same candidate again.";
            this.alert.error(message, this.options);
            this.clearActivityJobFields();
            return;
          }
        })
      }
      if (this.activity.job_description !== null && this.activity.job_description !== undefined) {
        this.addJob();
        this.clearActivityJobFields();
      }
    }
    else if ((this.activity.job_description === null || this.activity.job_description === undefined) &&
      (this.activity.activity_status !== null && this.activity.activity_status !== undefined)) {
      var message = "Job description field can not be empty. Please put a valid entry.";
      this.alert.error(message, this.options);
    }
    else if ((this.activity.job_description !== null && this.activity.job_description !== undefined) &&
      (this.activity.activity_status === null || this.activity.activity_status === undefined)) {
      var message = "Status field can not be empty. Please put a valid entry.";
      this.alert.error(message, this.options);
    }
    else {
      var message = "You are trying to add an empty form.Please fill the required entries.";
      this.alert.error(message, this.options);
    }

  }



  addJob() {
    //console.log(this.candidate_id)
    // console.log(this.activity.candidate_name)
    if (this.activity.submission_date === undefined || this.activity.submission_date === null) {
      this.activity.submission_date = moment(new Date()).format('YYYY-MM-DD');
      console.log(this.activity.submission_date)
      //      this.activity.submission_date= new Date().toISOString().split("T")[0];
    }

    var temp = ({} as JobDescriptions | any & { candidate_name: string });
    temp.job_description = this.activity.job_description;
    if (this.activity.jd_name) {
      temp.jd_name = this.activity.jd_name[0].client_name + "-" + this.activity.jd_name[0].job_title;
    } else if (this.jd_name) {
      temp.jd_name = this.jd_name;
    }
    if ((this.eventId === this.constants.ADD || this.eventId === this.constants.EDIT) && this.activity.candidate_name && this.activity.candidate_name != undefined) {
      temp.candidate_name = this.activity.candidate_name
      console.log(temp.candidate_name)
    }
    else {
      temp.candidate_name = this.candidate_id;
    }
    if (this.activity.activity_status === Constants.DEFAULT_STAGE)
      temp.stage_name = "Candidate Added";
    else if (this.activity.activity_status === Constants.CANDIDATE_SUBMISSION)
      temp.stage_name = "Submission";
    else
      temp.stage_name = this.activity.stage_name[0].stage_name;

    //var timestamp = new Date().toISOString().split("T")[1];
    temp.stage = this.activity.activity_status;
    // console.log(this.activity.submission_date)
    temp.submission_date = this.activity.submission_date //+ "T" + timestamp;
    // temp.submission_date = moment(this.activity.submission_date).toISOString()
    temp.display_date = this.activity.submission_date;
    temp.notes = this.activity.notes;

    if ((this.activity.activity_status === Constants.CANDIDATE_SUBMISSION || this.activity.activity_status === Constants.INTERNAL_INTERVIEW || this.activity.activity_status === Constants.CLIENT_INTERVIEW) && this.activity.schedule_interview_now) {
      temp.schedule_interview_now = this.activity.schedule_interview_now;
      temp.meeting_mode = this.activity.meeting_mode;
      temp.manual_invite = this.activity.manual_invite;
    } 

    // temp.min_rate= this.activity.min_rate;
    // temp.max_rate= this.activity.max_rate;
    // temp.min_salary= this.activity.min_salary;
    // temp.max_salary= this.activity.max_salary;

    if (this.activity.activity_status === Constants.SEND_OUT) {
      if (this.activity.send_out_date === undefined || this.activity.send_out_date === null) {
        //  temp.send_out_date = new Date().toISOString();
        temp.send_out_date = moment(new Date()).format('YYYY-MM-DD');
        console.log("In undefined and null" + " " + temp.send_out_date)
      }
      else {
        temp.send_out_date = this.activity.send_out_date;
        //temp.send_out_date = moment(this.activity.send_out_date).toISOString();
      }
    }
    else {
      temp.send_out_date = null;
    }
    //this.job_descriptions.push(temp);
    //console.log(temp.send_out_date)
    //console.log(temp)
    this.onSaveJob(temp);
    this.onCandidateEdit()
  }


  clearActivityJobFields() {
    this.activity.job_description = null;
    this.activity.job_status = null;
    this.activity.activity_status = Constants.DEFAULT_STAGE;
    this.activity.submission_date = this.date;
    this.activity.send_out_date = this.date;
    this.activity.stage_name = null;
    this.activity.jd_name = null;
    this.activity.notes = "";
    this.statusFormDisplay = false;
    /// a better place to perstine form
    this.form.form.markAsPristine()
  }


  onCandidateEdit() {
    this.appendResumeToCandidate();
    Object.keys(this.candidate).forEach(key => {
      if (this.candidate[key] === null || this.candidate[key] == '--' || (key == 'resume' && !this.isResumeUpdate) || (key == 'job_description')) {
        delete this.candidate[key];
      } else {
        if (key == 'resume' && this.isResumeUpdate) {
          this.formData.set(key, this.formData.get('resume'))
        } else {
          this.formData.set(key, this.candidate[key])
        }

      }
    });

    this.subscription2$ = this.service.patchCollectionItemById
      (APIPath.CANDIDATE, this.candidate_id, this.formData).subscribe((res) => {
        this.refreshOnModifyOrAdd();
      }, error => {
        this.refreshOnModifyOrAdd();
      });
  }

  onInterviewAdd() {
    console.log("onInterviewAdd");

    var formData1 = new FormData();
    formData1.append('time_zone', this.interview.time_zone);
    formData1.append('meeting_time', this.interview.meeting_time);
    // formData1.append('status', this.interview.status);
    formData1.append('remarks', this.interview.remarks);
    // formData1.append('recruiter_name', this.interview.recruiter_name);
    formData1.append('time_slot', this.interview.time_slot);
    formData1.append('source', this.interview.source);
    formData1.append('jd_attachment', this.interview.jd_attachment);
    // formData1.append('created_by', this.interview.created_by);
    // formData1.append('updated_by', this.interview.updated_by);
    // formData1.append('created_at', this.interview.created_at);
    // formData1.append('manual_time_slot', this.interview.manual_time_slot);
    formData1.append('manual_invite', this.interview.manual_invite);
    formData1.append('candidate_name',this.interview.candidate_name);
    // formData1.append('interviewer_name', JSON.stringify(this.interview.interviewer_name));
    let names: Array<any>= [];
    for(let i = 0 ; i < this.interview.interviewer_name.length; i ++){
      names.push(this.interview.interviewer_name[i].id);
    }
    formData1.append("interviewer_name", JSON.stringify(names));

    this.subscription3$ = this.service.createCollectionItem
      (APIPath.INTERVIEW, formData1).subscribe((res) => {
        this.interview = {} as Interview;
        this.onCandidateEdit()
      }, error => {
        console.log(error);
        this.interview = {} as Interview;
        this.onCandidateEdit()
      });
  }


  onSaveJob(item) {

    this.subscription1$ = this._api.createCollectionItem(APIPath.ADD_CANDIDATE_JOB_ACTIVITY, item)
      .subscribe((res: any) => {

        item.id = res.id;
        item.recruiter_name = this.userName;
        // this.job_descriptions.push(item);


        this.clearActivityJobFields();
        this.refreshListEvt.emit(null);

      }, error => {
        console.log(error);
      });
  }

  getUserLoggedInById() {
    this._api.getCollectionItemById(APIPath.USERS, sessionStorage.getItem(Constants.USER_ID)).subscribe((res: any) => {
      console.log(res);
      this.userName = res.first_name + " " + res.last_name;
    }, error => {
      console.log(error);
    })
  }


  id: string;

  modifyJob(item) {
    this.action = "edit";
    this.eventId = "edit"
    this.statusFormDisplay = true
    this.job_descriptions.forEach(_ => {
      if (item === _.job_description) {

        console.log("===========")
        console.log(_)
        console.log(this.activity);
        this.activity.job_description = _.job_description;
        this.activity.job_status = _.job_description.status;
        // this.activity.activity_status = _.stage.id;
        this.activity.submission_date = _.submission_date;
        if(this.job_descriptions.length>0 && _.stage.stage_name === "Submission" && this.activity.job_description === _.job_description){
          this.stage = Constants.CANDIDATE_SUBMISSION;
          this.activity.activity_status = this.stage;
        }else{
          this.activity.activity_status = _.stage.id;
        }
        this.activity.jd_name = _.jd_name;
        this.activity.notes = _.notes;
        this.activity.send_out_date = _.send_out_date;
        this.activity.schedule_interview_now = _.schedule_interview_now;
        this.activity.manual_invite = _.manual_invite;
        this.activity.meeting_mode = _.meeting_mode;
        this.id = _.id;

        //  console.log(_.candidate_name.min_salary)
        //  console.log(_.candidate_name.max_salary)
        //  console.log(_.candidate_name.min_rate)
        //  console.log(_.candidate_name.max_rate)
        //  console.log(_.candidate_name.activity_status)
        this.candidate.min_rate = _.candidate_name.min_rate;
        this.candidate.max_rate = _.candidate_name.max_rate;
        this.candidate.min_salary = _.candidate_name.min_salary;
        this.candidate.max_salary = _.candidate_name.max_salary;
        this.candidate.visa = _.candidate_name.visa;
        this.candidate.resume = _.candidate_name.resume;

        if ((this.candidate.min_salary ) || (this.candidate.max_salary )) {
          this.candidate.isSalary = "Yes";
          this.selectSalaryRateFlag = true;
        }
        else if ((this.candidate.min_rate ) || (this.candidate.max_rate )) { 

          this.candidate.isSalary = "No";
          this.selectSalaryRateFlag = false;
        }else{
          this.candidate.isSalary = "Yes";
        }


        if (this.candidate.max_salary)
          this.candidate.max_salary = Number(this.candidate.max_salary);
        else if (this.candidate.min_salary)
        this.candidate.min_salary = Number(this.candidate.min_salary);
        else if (this.candidate.min_rate)
        this.candidate.min_rate = Number(this.candidate.min_rate);
        else if (this.candidate.max_rate)
        this.candidate.max_rate = Number(this.candidate.max_rate);
      
        console.log(this.candidate)
        console.log((this.candidate.min_salary !== null && this.candidate.min_salary > 0));

        if(this.candidate.currency === "INR"){
       
          this.currencyTags = "₹"
          } else {
           
            this.currencyTags = "$"
            }
            console.log(this.currencyTags);

      }
    })
  }
  onCh(ev){
    console.log(ev);
  }


  modifyJobss(item) {
    this.action = "edit";
    this.eventId = "edit"
    this.statusFormDisplay = true

    this.job_descriptions.forEach(_ => {
      if (item === _.job_description) {
        this.activity.job_description = _.job_description;
        this.activity.job_status = _.job_description.status;
        this.activity.activity_status = _.stage.id;
        this.activity.submission_date = _.submission_date;
        this.activity.stage_name = _.stage_name;
        this.activity.jd_name = _.jd_name;
        this.activity.notes = _.notes;
        this.activity.send_out_date = _.send_out_date;
        this.activity.candidate_name = _.candidate_name;
        this.id = _.id;

        /**this.activity.min_rate = item.candidate_name.min_rate;
        this.activity.max_rate = item.candidate_name.max_rate;
        this.activity.min_salary = item.candidate_name.min_salary;
        this.activity.max_salary = item.candidate_name.max_salary;
        this.activity.visa = item.candidate_name.visa;  */



        /**this.activity.min_rate=_.min_rate;
        this.activity.max_rate=_.max_rate;
        this.activity.min_salary=_.min_salary;
        this.activity.max_salary=_.max_salary;
        this.activity.visa = _.visa;  */

      }
    })
  }


  onEditJob() {
    console.log(this.candidate_id)
    // console.log(this.activity.submission_date)
    if (this.activity.submission_date === undefined || this.activity.submission_date === null) {
      this.activity.submission_date = moment(new Date()).format('YYYY-MM-DD');
      console.log("Edit Job submission date Undefined portion" + " " + this.activity.submission_date)
    }
    else {
      //var date = new Date();
      //this.activity.submission_date = this.datePipe.transform(date, 'YYYY-mm-dd h:i:s');
      this.activity.submission_date = moment(this.activity.submission_date).format('YYYY-MM-DD') //+ "T" + new Date().toISOString().split("T")[1];
      console.log(this.activity.submission_date)
      //this.activity.submission_date = moment(moment(this.activity.submission_date).format('YYYY-MM-DD')).toISOString();
      //console.log(this.activity.submission_date)
    }
    if (this.activity.activity_status === Constants.SEND_OUT) {
      if (this.activity.send_out_date === undefined || this.activity.send_out_date === null) {
        //this.activity.send_out_date = new Date().toISOString();
        this.activity.send_out_date = moment(new Date()).format('YYYY-MM-DD');
        console.log("OnEditJob() send_out_dateundefined case" + " " + this.activity.send_out_date)
      }
      else {
        this.activity.send_out_date = moment(this.activity.send_out_date).format('YYYY-MM-DD');
        //this.activity.send_out_date = moment(moment(this.activity.send_out_date).format('YYYY-MM-DD')).toISOString();
        console.log("onEditJob() if not null case" + " " + this.activity.send_out_date)
      }
    }
    if ((this.activity.activity_status === Constants.CANDIDATE_SUBMISSION || this.activity.activity_status === Constants.INTERNAL_INTERVIEW || this.activity.activity_status === Constants.CLIENT_INTERVIEW) && ((this.activity.meeting_mode ==='auto' && (!this.interview || !this.interview.candidate_name)) || (this.activity.meeting_mode ==='manual' && !this.activity.manual_invite)) ) {

      if(this.activity.meeting_mode ==='auto'){
      this.alert.error("Please create an interview", this.options)
      }else {
        this.alert.error("Please copy/paste calender invite", this.options)
      }
      return;
    }

    console.log("this.activity.job_description: " + JSON.stringify(this.activity.job_description))
    var object = {
      stage: this.activity.activity_status,
      job_description: this.activity.job_description.id,
      submission_date: this.activity.submission_date,
      candidate_name: this.candidate_id,
      notes: this.activity.notes,
      send_out_date: this.activity.send_out_date,
      meeting_mode: this.activity.meeting_mode,
      manual_invite: this.activity.manual_invite

      //  min_rate:this.candidate.min_rate,
      //  max_rate:this.candidate.max_rate,
      //  min_salary:this.candidate.min_salary,
      //  max_salary:this.candidate.max_salary,
      //  visa:this.candidate.visa
    };
    this.subscription1$ = this._api.putCollectionItemById(APIPath.ADD_CANDIDATE_JOB_ACTIVITY, this.id, object)
      .subscribe((res: any) => {

        // console.log("edit")
        // console.log(res);
        this.job_descriptions.forEach(_ => {
          if (_.job_description === res.job_description) {
            _.display_date = moment(res.submission_date).format('YYYY-MM-DD');

            if (this.activity.stage_name[0].stage_name !== undefined)
              _.stage_name = this.activity.stage_name[0].stage_name;
            else
              _.stage_name = this.activity.stage_name;

            _.stage = this.activity.activity_status;
            _.submission_date = res.submission_date;
            _.notes = this.activity.notes;
            _.send_out_date = this.activity.send_out_date;

            // _.min_salary=this.activity.min_salary;
            // _.max_salary=this.activity.max_salary;
            // _.min_rate=this.activity.min_rate;
            // _.max_rate=this.activity.max_rate

          }
        })
        this.clearActivityJobFields();
        this.refreshListEvt.emit(null);
        this.action = "add";




        if ((this.interview && this.interview.candidate_name && this.interview.candidate_name !== undefined && this.interview.candidate_name !== null)) {
          this.onInterviewAdd()

        } else {
          this.onCandidateEdit()
        }


      }, error => {
        console.log(error);
      });
  }


  deleteJob(id: string, jd_name: string): void {
    const modalRef = this.modalService.open(DeleteComponent, { backdrop: 'static', centered: true, keyboard: false, });
    modalRef.componentInstance.id = id;
    modalRef.componentInstance.title = Constants.JOB_DESC;
    modalRef.componentInstance.name = jd_name;
    modalRef.result.then(res => {
      if (res.result) {
        this.subscription1$ = this._api.deleteCollectionItemById(APIPath.ADD_CANDIDATE_JOB_ACTIVITY, id)
          .subscribe((res: any) => {
            this.job_descriptions = this.job_descriptions.filter(_ => {
              if (id !== _.id) {
                return _;
              }
            })
            this.refreshListEvt.emit(null);
          })
      }
    });
  }


  public changeFormToDirty(event): void {
    this.form.form.markAsDirty();
    console.log("Event output: " + JSON.stringify(event))
  }

  //selectSalaryRateFlag:boolean;


  // selectSalaryOrRate(evt:string){
  //   if(evt==='salary'){
  //      this.selectSalaryRateFlag= true;
  //      this.activity.isSalary="Yes";
  //      this.activity.max_rate=null;
  //      this.activity.min_rate=null;
  //      //console.log("called salary")
  //   }
  //   else if(evt==='rate'){
  //       this.selectSalaryRateFlag= false;
  //       this.activity.isSalary="No";
  //       //console.log("called rate");
  //       this.activity.max_salary=null;
  //       this.activity.min_salary=null;

  //   }
  // }


  // deleteJob(id:string){

  //   this.subscription1$ = this._api.deleteCollectionItemById(APIPath.ADD_CANDIDATE_JOB_ACTIVITY, id)
  //   .subscribe((res: any) => {
  //  //call delete API
  //  this.job_descriptions=this.job_descriptions.filter(_=>{
  //   if(id!==_.id){
  //   return _;
  //   }
  //   })
  //   this.refreshListEvt.emit(null);
  //   });
  //      }

  checkSubmissionDateValidity() {
    console.log("hello vishnu");
    this.submissionDateError = !this.isSubmissionDateValid();
  }

  isSubmissionDateValid(): boolean {
    console.log(this.candidate.created_at);
    console.log(this.activity.submission_date);
    return this.activity.submission_date >= moment(this.candidate.created_at).format('YYYY-MM-DD');
  }
}
