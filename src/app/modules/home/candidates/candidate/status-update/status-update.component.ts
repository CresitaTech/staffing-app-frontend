import { Component, OnInit, Output, Input, EventEmitter, ViewChild, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Subscription } from 'rxjs';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Activity } from 'src/app/models/activity';
import { JobDescriptions } from 'src/app/models/candidate';
import { AlertService } from 'src/app/services/alert/alert.service';

import { APIProviderService } from 'src/app/services/api-provider.service';
declare const $: any;

@Component({
  selector: 'app-status-update',
  templateUrl: './status-update.component.html',
  styleUrls: ['./status-update.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class StatusUpdateComponent implements OnInit {

  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;
  @Input() candidatesNameArray;
  @Input() candidatesIdArray;
  @Input() job_description;
  @Input() stage: any;
  activity = { notes: '' } as Activity;
  constants = Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;

  dropdownSettings: IDropdownSettings;
  dropdownList = [];
  selectedItems = [];

  @ViewChild("closebutton") closebutton;
  @ViewChild("f") form: NgForm;

  action: string = "add";
  job_descriptions: Array<JobDescriptions | any> = [];
  date = moment(new Date()).format('YYYY-MM-DD');

  constructor(
    private _api: APIProviderService<Activity>,
    public activeModal: NgbActiveModal,
    private alert: AlertService,
    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>,
    public modalService: NgbModal
  ) {
    this.stageid();
    this.activity.submission_date = this.date;
    this.activity.send_out_date = this.date;

  }

  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };

  ngOnInit(): void {
    this.initialise();
    this.stageid();
    this.activity.activity_status = null
    console.log(this.activity)
    console.log(this.candidatesNameArray);
    console.log(this.candidatesIdArray);
    this.dropdownSettings = {
      singleSelection: false,
      enableCheckAll: false,
      idField: 'id',
      textField: 'candidate_name',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
  }

  ngOnChanges(): void {
    this.activity.activity_status = this.stage;
    // console.log(this.activity.activity_status);
    this.initialise();
  }

  stageid() {
    if (this.eventId === Constants.POP_UP) {
      this.activity.activity_status = this.stage;

    }
  }

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }


  initialise() {
    // if (this.indexAsInput != undefined)
    // this.getActivityById(this.indexAsInput);
  }


  detailsOfSelectedCandidate(evt) {
    // console.log(evt.stage.id)
    // this.activity.activity_status = evt.stage;
    // this.getActivityById(evt);

  }


  /*onSave() {
    if ((this.activity.submission_date !== null && this.activity.submission_date !== undefined) &&
      (this.activity.activity_status !== null && this.activity.activity_status !== undefined)) {

      this.candidatesIdArray.forEach(id => {
        if (this.activity.job_description === id.job_description) {
          this.activity.id = id;


          //this.alert.error(message, this.options);
          // this.clearActivityJobFields();
        }
      })
    }
    if (this.activity.job_description !== null && this.activity.job_description !== undefined) {
      this.addJob();
      this.clearActivityJobFields();
    }

  }*/



  /*
    getActivityById(index: string) {
      this.job_descriptions = [];
  
      this._api.getCollectionItemByCandidateId(APIPath.GET_CANDIDATE_JOB_STAGES, index).subscribe((res: any) => {
        //  this.activity = res;
        console.log(res);
        this.candidate_id = index;
        res.forEach(_ => {
          var temp: any = {};
          temp.jd_name = _.job_description.client_name.company_name + "-" + _.job_description.job_title;
          temp.stage_name = _.stage.stage_name;
          temp.display_date = moment(_.submission_date).format('YYYY-MM-DD');
          temp.job_description = _.job_description.id;
          temp.submission_date = _.submission_date;
          temp.stage = _.stage.id;
          temp.id = _.id;
          temp.candidate_id = _.candidate_name.id;
          temp.notes = _.notes;
          temp.send_out_date = _.send_out_date;
  
          // temp.min_salary=_.min_salary;
          // temp.max_salary=_.max_salary
          // temp.min_rate=_.min_rate;
          // temp.max_rate=_.max_rate;
          // if(this.activity.job_min_salary!=null ||this.activity.job_max_salary!=null){
          //   this.activity.isSalary="Yes";
          //   this.selectSalaryRateFlag= true;
          //  }
          //  else{
          //   this.activity.isSalary="No";
          //   this.selectSalaryRateFlag= false;
          //  }
          this.job_descriptions.push(temp);
  
        })
      }, error => {
        console.log(error);
  
      })
    }*/

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



  refreshOnModifyOrAdd(res) {
    this.activity = {} as Activity;
    this.refreshListEvt.emit(null);
    // if (this.eventId === this.constants.POP_UP) {
    //   this.activeModal.close(res);
    // }
  }

  /*addEditButton(action) {
    /// if form is edit then check for edit or add operation
    /// do update state after each add and edit separately
    if (!this.form.pristine) {
      if (action === 'add') {
        this.addJobToArray();
      }
      else if (action === 'edit') {
        this.onEditJob();
      }
    }
    this.activeModal.close();
  }*/

  /*addJobToArray() {
    if ((this.activity.job_description !== null && this.activity.job_description !== undefined) &&
      (this.activity.activity_status !== null && this.activity.activity_status !== undefined)) {

      if (this.job_descriptions.length > 0) {
        this.job_descriptions.forEach(_ => {
          if (this.activity.job_description === _.job_description) {
            var message = "You are trying to add an existing job description, for the same candidate again.";
            this.alert.error(message, this.options);
            this.clearActivityJobFields();
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





  }*/



  addJob() {
    if (this.activity.submission_date === undefined || this.activity.submission_date === null) {
      this.activity.submission_date = moment(new Date()).format('MM-DD-YYYY');
      //      this.activity.submission_date= new Date().toISOString().split("T")[0];
    }

    var temp = ({} as JobDescriptions | any & { candidate_name: string });
    temp.job_description = this.activity.job_description;
    temp.jd_name = this.activity.jd_name[0].client_name + "-" + this.activity.jd_name[0].job_title;
    // temp.candidate_name = this.candidate_id;
    if (this.activity.activity_status === Constants.DEFAULT_STAGE)
      temp.stage_name = "Candidate Added";
    else
      temp.stage_name = this.activity.stage_name[0].stage_name;

    var timestamp = new Date().toISOString().split("T")[1];
    temp.stage = this.activity.activity_status;
    // temp.submission_date= this.activity.submission_date+"T"+timestamp;
    temp.submission_date = moment(this.activity.submission_date).toISOString()
    temp.display_date = this.activity.submission_date;
    temp.notes = this.activity.notes;

    // temp.min_rate= this.activity.min_rate;
    // temp.max_rate= this.activity.max_rate;
    // temp.min_salary= this.activity.min_salary;
    // temp.max_salary= this.activity.max_salary;

    if (this.activity.activity_status === Constants.SEND_OUT) {
      if (this.activity.send_out_date === undefined || this.activity.send_out_date === null) {
        temp.send_out_date = new Date().toISOString();
      }
      else {
        // temp.send_out_date= this.activity.send_out_date+"T"+timestamp; 
        temp.send_out_date = moment(this.activity.send_out_date).toISOString();
      }
    }
    else
      temp.send_out_date = null;
    //this.job_descriptions.push(temp);
    // this.onSaveJob(temp);
  }


  clearActivityJobFields() {
    this.activity.job_description = null;
    this.activity.activity_status = Constants.DEFAULT_STAGE;
    this.activity.submission_date = this.date;
    this.activity.send_out_date = this.date;
    this.activity.stage_name = null;
    this.activity.jd_name = null;
    this.activity.notes = "";

    /// a better place to perstine form
    this.form.form.markAsPristine()
  }



  onSaveJob() {
    console.log(this.activity.submission_date)
    if (this.activity.submission_date === undefined || this.activity.submission_date === null) {
      this.activity.submission_date = new Date().toISOString();
    }
    else {
      this.activity.submission_date = moment(this.activity.submission_date).format('YYYY-MM-DD') + "T" + new Date().toISOString().split("T")[1];
    }
    //this.activity.submission_date = moment(moment(this.activity.submission_date).format('YYYY-MM-DD')).toISOString();
    //}

    var object = {
      id: this.candidatesIdArray,
      candidate_name: this.candidatesNameArray,
      stage: this.activity.activity_status,
      submission_date: this.activity.submission_date,
      // candidate_name: this.candidate_id,
      //  min_rate:this.activity.min_rate,
      //  max_rate:this.activity.max_rate,
      //  min_salary:this.activity.min_salary,
      //  max_salary:this.activity.max_salary
    };

    console.log(object)

    /*this.subscription1$ = this._api.putCollectionItemById(APIPath.ADD_CANDIDATE_JOB_ACTIVITY, this.id, object)
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

            // _.min_salary=this.activity.min_salary;
            // _.max_salary=this.activity.max_salary;
            // _.min_rate=this.activity.min_rate;
            // _.max_rate=this.activity.max_rate
          }
        })
        this.clearActivityJobFields();
        this.refreshListEvt.emit(null);
        //this.action = "add";
      }, error => {
        console.log(error);
      });*/
  }
  id: string;


  /*  modifyJob(item) {
      this.action = "edit";
  
      this.job_descriptions.forEach(_ => {
        if (item === _.job_description) {
          this.activity.job_description = _.job_description;
          this.activity.activity_status = _.stage;
          this.activity.submission_date = _.submission_date;
          this.activity.stage_name = _.stage_name;
          this.activity.jd_name = _.jd_name;
          this.activity.notes = _.notes;
          this.activity.send_out_date = _.send_out_date;
          this.activity.candidate_name = _.candidate_name;
          this.id = _.id;
  
          // this.activity.min_rate=_.min_rate;
          // this.activity.max_rate=_.max_rate;
          // this.activity.min_salary=_.min_salary;
          // this.activity.max_salary=_.max_salary;
  
        }
      })
    }*/

  onClose() {

    this.modalService.dismissAll('Close click')
  }

  /*onEditJob() {
    console.log(this.activity.submission_date)
    if (this.activity.submission_date === undefined || this.activity.submission_date === null) {
      this.activity.submission_date = new Date().toISOString();
    }
    else {
      // this.activity.submission_date= moment(this.activity.submission_date).format('YYYY-MM-DD')+"T"+new Date().toISOString().split("T")[1]; }
      this.activity.submission_date = moment(moment(this.activity.submission_date).format('YYYY-MM-DD')).toISOString();
    }
    if (this.activity.activity_status === Constants.SEND_OUT) {
      if (this.activity.send_out_date === undefined || this.activity.send_out_date === null) {
        this.activity.send_out_date = new Date().toISOString();
      }
      else {
        // this.activity.send_out_date=moment(this.activity.send_out_date).format('YYYY-MM-DD')+"T"+new Date().toISOString().split("T")[1]; 
        this.activity.send_out_date = moment(moment(this.activity.send_out_date).format('YYYY-MM-DD')).toISOString();
      }
    }
    var object = {
      stage: this.activity.activity_status,
      job_description: this.activity.job_description,
      submission_date: this.activity.submission_date,
      // candidate_name: this.candidate_id,
      notes: this.activity.notes,
      send_out_date: this.activity.send_out_date,

      //  min_rate:this.activity.min_rate,
      //  max_rate:this.activity.max_rate,
      //  min_salary:this.activity.min_salary,
      //  max_salary:this.activity.max_salary
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
      }, error => {
        console.log(error);
      });
  }*/

  /* public changeFormToDirty(event): void {
     this.form.form.markAsDirty();
   }*/

}
