import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Candidate } from 'src/app/models/candidate';
import { Submission } from 'src/app/models/submission-list';
import { User } from 'src/app/models/user';
import { APIProviderService } from 'src/app/services/api-provider.service';


@Component({
  selector: 'app-add-submission',
  templateUrl: './add-submission.component.html',
  styleUrls: ['./add-submission.component.scss']
})
export class AddSubmissionComponent implements OnInit {


  @Input() actionName;
  @Input() job_id;
  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput:string;
  @Input() eventId:string;
  @Input() candidate_name;
  @Input() candidate_id;
 // @Input() assignee_name;
  @Input() submission_assignee;
  submission={} as Submission;
  @ViewChild('closebutton') closebutton;
  constants=Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;


  constructor(
    private _api:APIProviderService<Submission>,
    public activeModal: NgbActiveModal,
  ) {

  }

  ngOnInit(): void {
    this.submission.remarks="";
    this.submission.candidate_name= this.candidate_name;
    console.log("job_id"+this.job_id);
    // if(this.assignee_name){
    //   this.submission.assignee_name= this.assignee_name.first_name+" "+this.assignee_name.last_name;
    //   this.submission.assignee_email= this.assignee_name.email;
    // }
    // if(this.submission_assignee){
    //   this.submission.assignee_name= this.submission_assignee.first_name+" "+this.submission_assignee.last_name;
    //   this.submission.assignee_email= this.submission_assignee.email;
    // }

    this.getUserLoggedInById(sessionStorage.getItem(Constants.USER_ID))

  }

  ngOnChanges(): void {
    if(this.indexAsInput!=undefined)
    this.getSubmissionById(this.indexAsInput);
  }


  getSubmissionById(index:string){
    this._api.getCollectionItemById(APIPath.JOB_SUBMISSION,index).subscribe((res)=>{
      this.submission=res;
    }, error=>{
      console.log(error);
})
  }

  getUserLoggedInById(index:string){
    this._api.getCollectionItemById(APIPath.USERS,index).subscribe((res:any)=>{
      // this.submission.recruiter_name= res.id;
      // this.submission.recruiter_email=res.email;
      this.submission.assignee_name= res.first_name+" "+res.last_name;
      this.submission.assignee_email=res.email;
        }, error=>{
      console.log(error);
})
  }

  onEdit(){

    this.subscription2$=this._api.putCollectionItemById
    (APIPath.JOB_SUBMISSION,this.indexAsInput, this.submission).subscribe((res)=>{
    // console.log(res);
   this.refreshOnModifyOrAdd();
  }, error=>{
    console.log(error);

})
    }

  onSubmit(){
    this.subscription1$ = this._api.createCollectionItem(APIPath.JOB_SUBMISSION,this.submission)
      .subscribe((res: any) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      } , error=>{
            console.log(error);

      });

  }

  refreshOnModifyOrAdd(){
    this.submission={} as Submission;
     //window.location.reload();
    this.refreshListEvt.emit(null);
    if(this.eventId===this.constants.POP_UP){
      this.closebutton.nativeElement.click();
    }
  }

  // getCandidateresume(id:string){

  // }

}






