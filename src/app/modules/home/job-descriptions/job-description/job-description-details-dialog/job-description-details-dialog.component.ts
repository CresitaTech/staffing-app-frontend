import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { JobDescription } from 'src/app/models/job-description';

@Component({
  selector: 'app-job-description-details-dialog',
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{job.job_title}}</h5>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="row">
        <div class="col">
          <h6>Job Description</h6>
         
          <app-editor [id]="'editor1'" [readOnly]="true" [content]="job.job_description" [hasTags]="false"
                                    (contentChanged)="job.job_description = $event"></app-editor>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" (click)="activeModal.dismiss()">Close</button>
      
    </div>
  `,
  styles: [
  ]
})
export class JobDescriptionDetailsDialogComponent {

  @Input() job: JobDescription;
  @Output() deleteEvt = new EventEmitter<null>();

  constructor(public activeModal: NgbActiveModal) { }

  delete() {
    this.deleteEvt.emit(null)
  }

}
