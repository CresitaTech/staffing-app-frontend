import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { constants } from 'os';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { CandidateStages } from 'src/app/models/candidateStages';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { CandidateReviewMessageComponent } from '../candidate-review-message/candidate-review-message.component';

@Component({
  selector: 'app-candidate-stages',
  template: `<div class="form-row">
  <div class="col form-group">
   
    <div class="form-row">
      <div class="col">
        <ng-select #select [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
        bindLabel="stage_name" bindValue="id"
        #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
        <ng-template ng-header-tmp >
        <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)"/>
        </ng-template>
        </ng-select>
        <span id='reviewError' style="color:red">{{reviewError}}</span>
      </div>
    </div>
  </div>  
</div>           
`,
  styles: [
  ]



})
export class CandidateStagesComponent extends Paging<CandidateStages> {
  api_path = APIPath.CANDIDATE_STAGES
  review_api_path = APIPath.CANDIDATE_STAGES_REVIEWS

  constructor(
    _api: APIProviderService<CandidateStages>,
    _selectAll: SelectAllService,
    private modalService: NgbModal
  ) {
    super(_api, _selectAll);
  }

  @Input() item: string;
  @Output() changeItemEvt = new EventEmitter<string>();
  @Output() emitStageName = new EventEmitter<any>();
  @Output() reviewStatus = new EventEmitter<any>();
  private getSub: Subscription;
  @Input() jobdescription: string;
  @Input() candidates: string;
  @Input() candidate_id: string;
  @Input() job_status?: string;
  @Input() status_type: string = "External";
  @Input() jobdescriptions: any;
  @Input() userName: any;
  @Input() stage: any;
  @Input() action: any;
  selectedElement: string;
  reviewError: string;

  ngOnInit(): void {

    this.getList();
    if (!this.item && this.status_type === "External") {
      this.changeItemEvt.emit(Constants.DEFAULT_STAGE)
      this.emitStage(Constants.DEFAULT_STAGE)
    }

    
    console.log('jobdescription: ' + JSON.stringify(this.jobdescription))
    console.log('candidate_id: ' + JSON.stringify(this.candidate_id))
    console.log(this.job_status);

    // this.jobdescriptions.forEach(_ => {

    //   console.log(this.stage);
    //   if (this.stage === Constants.DEFAULT_STAGE && this.jobdescriptions.length> 0 && this.action === "edit") {
    //     this.reviewError = "Candidate Add is not allowed as is already added";
    //     this.reviewStatus.emit(false)
    //   }
    // })
  }

  // ngOnChanges(){
  //   this.getList();
  //   if(!this.item ) 
  //   this.changeItemEvt.emit(Constants.DEFAULT_STAGE)
  // }

  ngOnDestroy(): void {
    // if (this.getSub) this.getSub.unsubscribe();

  }

  openReviewModal() {
    const modalOptions: NgbModalOptions = {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg',
    }
    const modalRef = this.modalService.open(CandidateReviewMessageComponent, modalOptions);
    modalRef.result.then(res => {
      console.log(res)

    }, error => {
      console.log(error);
    });
  }


  getList(): void {
    //this.fetchCollectionList();
    this.fetchCollectionListWithExactAPI(this.api_path + '?ordering=-created_at&offset=0&limit=25&type=' + this.status_type);
  }

  getReviewList(candidate_id, jobdescription, recruiter_id): void {
    var path = this.review_api_path + "?ordering=-created_at&offset=0&limit=25&";


    if (candidate_id != null) {
      path+='candidate_id=' + candidate_id;
     } else if (recruiter_id != null) {
      path+='recruiter_id=' + recruiter_id;
     
    }
    path+='&jobdescription_id=' + (jobdescription.id ? jobdescription.id : jobdescription);

    this._api.getListAPI(path).subscribe(res => {
      console.log(res.count)
      if (res.count == 0) {
        //this.openReviewModal()
        if (candidate_id != null) {
          this.reviewError = "Please add review on candidate before sendout to client"
         } else if (recruiter_id != null) {
          this.reviewError = "This job is not assigned to you. Please contact the BDM of this job."
         
        }
      
        this.reviewStatus.emit(false)

      }
    })
  }

  change(event): void {
    console.log(event + "change")
    this.reviewError = "";
    this.reviewStatus.emit(true)
    if (event == Constants.SEND_OUT && this.candidate_id != undefined && this.jobdescription != undefined) {
      this.getReviewList(this.candidate_id, this.jobdescription, null)
    } else if(event == Constants.CANDIDATE_SUBMISSION  && this.job_status === "SubmissionNotAccepted"){
      this.reviewError = "Submission is not allowed on this job. Please contact to your BDM"
      this.reviewStatus.emit(false)

    }else if(event == Constants.CANDIDATE_SUBMISSION  && this.jobdescription != undefined){
      this.getReviewList(null, this.jobdescription, sessionStorage.getItem(Constants.USER_ID))
    }else if(event == Constants.DEFAULT_STAGE && this.jobdescriptions.length> 0){
      this.reviewError = "Candidate Add is not allowed as is already added";
      this.reviewStatus.emit(false)

    }
   
    //console.log('jobdescription: ' + JSON.stringify(this.jobdescription))
    //console.log('candidate_id: ' + JSON.stringify(this.candidate_id))
    this.emitChange(event);
  }


  emitStage(str) {
    var temp = this.collection.filter(_ => {
      if (_.id === str) {
        return _;
      }
    })
    this.emitStageName.emit(temp);
  }

  emitChange(event): void {
    //console.log('event: ' + event)
    this.changeItemEvt.emit(event);
    this.emitStage(event)
  }

}
