import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Constants } from 'ag-grid-community';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Activity } from 'src/app/models/activity';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-submission-details',
  templateUrl: './submission-details.component.html',
  styleUrls: ['./submission-details.component.scss']
})
export class SubmissionDetailsComponent implements OnInit {

  constructor(
    public activeModal: NgbActiveModal,
    private _api: APIProviderService<Activity>,
    private modalService: NgbModal) {

  }

  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;
  @Input() candidate_name;
  @Input() candidate_id: string;
  @Input() job_description;
  @Input() stage: any;
  job_descriptions = []
  activity = { notes: '' } as Activity;
  @ViewChild('closebutton') closebutton;
  constants = Constants;
  emptyFlag = false;
  subscription1$: Subscription;
  ngOnInit(): void {

    //console.log(this.job_description)
    this.initialise()
    //console.log(this.activity.submission_date)
    //console.log(this.activity.send_out_date)
    //console.log(this.job_descriptions)
  }


  initialise() {
    if (this.indexAsInput != undefined)
      this.getActivityById(this.indexAsInput);
  }

  detailsOfSelectedCandidate(evt) {
    // console.log(evt.stage.id)
    // this.activity.activity_status = evt.stage;
    this.getActivityById(evt);

  }
  getActivityById(index: string) {
    this.job_descriptions = [];
    this._api.getCollectionItemByCandidateId(APIPath.CANDIDATES_FOR_SUBMISSION_JOB, index).subscribe((res: any) => {
      this.candidate_id = index;
      console.log(res)
      if (res.length === 0)
        this.emptyFlag = true;
      //console.log(this.activity)
      res.forEach(_ => {
        _.submission_date = moment(_.submission_date).format('MM-DD-YYYY');
        //   console.log(this.job_descriptions)
      })
      this.activity = res;

    }, error => {
      console.log(error);

    })
  }
}
