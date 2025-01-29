import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Designation } from 'src/app/models/designation';

@Component({
  selector: 'app-designation-delete',
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Delete Designation</h5>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="row">
        <div class="col">
          <h6>Are you sure?</h6>
          <p>Are you sure you want to delete the Designation <strong class="font-weight-bold">"{{designation}}"?</strong></p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-danger" (click)="activeModal.close({result: true, id: designation})">Confirm</button>
      <button type="button" class="btn btn-primary" (click)="activeModal.dismiss()">Cancel</button>
    </div>
  `,
  styles: [
  ]
})
export class DesignationDeleteComponent {

  @Input() designation;
  @Output() deleteEvt = new EventEmitter<null>();

  constructor(public activeModal: NgbActiveModal) { }

  delete() {
    this.deleteEvt.emit(null)
  }

}
