import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { JobDescription } from 'src/app/models/job-description';

@Component({
  selector: 'app-job-description-delete',
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Delete Job Description</h5>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="row">
        <div class="col">
          <h6>Are you sure?</h6>
          <p>Are you sure you want to delete the Job <strong class="font-weight-bold">"{{job.job_title}}"?</strong></p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-danger" (click)="activeModal.close({result: true, id: job.id})">Confirm</button>
      <button type="button" class="btn btn-primary" (click)="activeModal.dismiss()">Cancel</button>
    </div>
  `,
  styles: [
  ]
})
export class JobDescriptionDeleteComponent {

  @Input() job: JobDescription;
  @Output() deleteEvt = new EventEmitter<null>();

  constructor(public activeModal: NgbActiveModal) { }

  delete() {
    this.deleteEvt.emit(null)
  }

}
