import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-delete',
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Delete {{title}}</h5>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="row">
        <div class="col">
          <h6>Are you sure?</h6>
          <p>Are you sure you want to delete the {{title}} <strong class="font-weight-bold">"{{name}}"?</strong></p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-danger" (click)="activeModal.close({result: true, id:id})">Yes, Delete</button>
      <button type="button" class="btn btn-primary" (click)="activeModal.dismiss()">Cancel</button>
    </div>
  `,
  styles: [
  ]
})
export class DeleteComponent {

  @Input() id: string;
  @Input() name: string
  @Input() title: string;
  @Output() deleteEvt = new EventEmitter<null>();

  constructor(public activeModal: NgbActiveModal) { }

  delete() {
    this.deleteEvt.emit(null)
  }

}
