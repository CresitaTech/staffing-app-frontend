import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-info-dialog',
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{title}}</h5>
     
    </div>
    <div class="modal-body">
      <div class="row">
        <div class="col">
          
          <p>{{description}}</p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
    <button type="button" class="btn btn-primary" (click)="activeModal.close({result: true})">Ok</button>
    </div>
  `,
  styles: [
  ]
})
export class InfoDialogComponent {

  @Input() description: string
  @Input() title: string;
  @Output() deleteEvt = new EventEmitter<null>();

  constructor(public activeModal: NgbActiveModal) { }

  delete() {
    this.deleteEvt.emit(null)
  }

}
