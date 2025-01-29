import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Interviewer } from 'src/app/models/interviewer';
import { Interview } from 'src/app/models/interviews';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-add-interview',
  templateUrl: './add-interview.component.html',
  styleUrls: ['./add-interview.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class AddInterviewComponent implements OnInit {
  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;
  @Input() candidate_name;
  @Input() candidate_id;
  @Input() jobId;
  interview = {} as Interview;
  @ViewChild('closebutton') closebutton;
  constants = Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;
  file: File;
  formData: FormData;
  @Output() closeAddEditPage = new EventEmitter<any>();

  isShowManualInvite = false;


  constructor(
    private _api: APIProviderService<Interview>,
    public activeModal: NgbActiveModal,

    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>
  ) {

    this.interview.remarks = '';
    // if (this.indexAsInput != undefined)
    // this.getInteriewById(this.indexAsInput);
  }

  ngOnInit(): void {
    this.interview.candidate_name = this.candidate_id;
    this.interview.jd_attachment = (this.jobId && this.jobId.id) ? this.jobId?.id : (this.jobId) ? this.jobId : null;

    if (this.indexAsInput !== undefined)
      this.getInteriewById(this.indexAsInput);
    console.log("this.candidate_id");
    console.log(this.candidate_id);
    console.log(this.candidate_name);

    var userCountry = sessionStorage.getItem(Constants.USER_COUNTRY);
    if (this.eventId === this.constants.ADD || this.eventId === this.constants.POP_UP) {

      if (userCountry == "India") {
        this.interview.time_zone = "IST";
      } else if (userCountry == "US" || userCountry == "United States of America") {
        this.interview.time_zone = "PST";
      }
    }
  }

  addInterviewer(event): void {
    console.log("addInterviewer");
    console.log(event);
    console.log("addInterviewer");
    if (!event) {
      return;
    }

    if (this.interview.interviewer_name) {

      var found = false;
      for (var i = 0; i < this.interview.interviewer_name.length; i++) {
        if (this.interview.interviewer_name[i].primary_email === event.primary_email) found = true;
      }

      if (!found && event.primary_email && event.primary_email !== null) {

        var temp = {} as Interviewer | any;
        temp.id = event.id;
        temp.first_name= event.first_name;
        temp.last_name= event.last_name;
        temp.zoom_username= event.zoom_username;
        temp.zoom_password= event.zoom_password;
        temp.zoom_api_key= event.zoom_api_key;
        temp.zoom_api_secret= event.zoom_api_secret;
        temp.zoom_token= event.zoom_token;
        temp.gmeet_username= event.gmeet_username;
        temp.gmeet_password= event.gmeet_password;
        temp.gmeet_api_key= event.gmeet_api_key;
        temp.gmeet_api_secret= event.gmeet_api_secret;
        temp.gmeet_token= event.gmeet_token;
        temp.primary_email= event.primary_email;
        temp.secondary_email= event.secondary_email;
        temp.phone_number= event.phone_number;
        this.interview.interviewer_name.push(temp);


      }



    }
    else {
      this.interview.interviewer_name = [];

      var temp = {} as Interviewer | any;
      temp.id = event.id;
      temp.first_name= event.first_name;
      temp.last_name= event.last_name;
      temp.zoom_username= event.zoom_username;
      temp.zoom_password= event.zoom_password;
      temp.zoom_api_key= event.zoom_api_key;
      temp.zoom_api_secret= event.zoom_api_secret;
      temp.zoom_token= event.zoom_token;
      temp.gmeet_username= event.gmeet_username;
      temp.gmeet_password= event.gmeet_password;
      temp.gmeet_api_key= event.gmeet_api_key;
      temp.gmeet_api_secret= event.gmeet_api_secret;
      temp.gmeet_token= event.gmeet_token;
      temp.primary_email= event.primary_email;
      temp.secondary_email= event.secondary_email;
      temp.phone_number= event.phone_number;
      this.interview.interviewer_name.push(temp);


    }
    // console.log(this.selectedElement);


    // console.log(this.collections);
    // this.collections.forEach((item, index) => {
    //   if (item.primary_email) item.primary_email = null;
    // });


  }


  removeInterviewer(email) {

    this.interview.interviewer_name.forEach((item, index) => {
      if (item.primary_email === email) this.interview.interviewer_name.splice(index, 1);
    });
  }


  ngOnChanges(): void {
    if (this.indexAsInput !== undefined)
      this.getInteriewById(this.indexAsInput);
  }

  // ngAfterViewInit(){
  //   if (this.indexAsInput != undefined)
  //   this.getInteriewById(this.indexAsInput);
  // }

  getInteriewById(index: string) {
    this._api.getCollectionItemById(APIPath.INTERVIEW, index).subscribe((res) => {
      this.interview = res;
    }, error => {
      console.log(error);

    })
  }

  onEdit() {

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

    let names: Array<any>= [];
    for(let i = 0 ; i < this.interview.interviewer_name.length; i ++){
      names.push(this.interview.interviewer_name[i].id);
    }
    formData1.append("interviewer_name", JSON.stringify(names));

    this.subscription2$ = this._api.putCollectionItemById
      (APIPath.INTERVIEW, this.indexAsInput, formData1).subscribe((res) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);

      })
  }

  appendJD() {
    this.formData = new FormData();
    console.log("*****Data To Submit");
    console.log(this.interview);
    const keys = Object.keys(this.interview);
    keys.forEach(k => {
      if (this.interview[k]) this.formData.append(k, this.interview[k])
    })
    this.formData.append('resume', this.file);
  }

  onSubmit() {
    // this.appendJD();
    if (this.jobId) {
      this.refreshListEvt.emit(this.interview);
    } else {
      var formData1 = new FormData();
      formData1.append("time_zone", this.interview.time_zone);
      formData1.append("meeting_time", this.interview.meeting_time);
      // formData1.append("status", this.interview.status);
      formData1.append("remarks", this.interview.remarks);
      // formData1.append("recruiter_name", this.interview.recruiter_name);
      formData1.append("time_slot", this.interview.time_slot);
      formData1.append("source", this.interview.source);
      formData1.append("jd_attachment", this.interview.jd_attachment);
      // formData1.append("created_by", this.interview.created_by);
      // formData1.append("updated_by", this.interview.updated_by);
      // formData1.append("created_at", this.interview.created_at);
      // formData1.append("manual_time_slot", this.interview.manual_time_slot);
      formData1.append("manual_invite", this.interview.manual_invite);
      formData1.append("candidate_name",this.interview.candidate_name);
      let names: Array<any>= [];
      for(let i = 0 ; i < this.interview.interviewer_name.length; i ++){
        names.push(this.interview.interviewer_name[i].id);
      }
      formData1.append("interviewer_name", JSON.stringify(names));
      this.subscription1$ = this._api.createCollectionItem(APIPath.INTERVIEW, formData1)
        .subscribe((res: any) => {
          // console.log(res);
          this.refreshOnModifyOrAdd();
        }, error => {
          console.log(error);

        });
    }
  }

  refreshOnModifyOrAdd() {
    this.interview = {} as Interview;
    //window.location.reload();
    this.refreshListEvt.emit(null);
    // if(this.eventId===this.constants.POP_UP){
    //   this.closebutton.nativeElement.click();
    // }
  }

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }

  readFile(event) {

    this.file = (<HTMLInputElement>event.target).files[0];
    console.log(this.file);
  }

  closeInterview() {
    this.closeAddEditPage.emit(null);
  }

}