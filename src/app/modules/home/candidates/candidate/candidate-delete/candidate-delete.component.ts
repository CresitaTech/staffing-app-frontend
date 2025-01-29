import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Candidate } from 'src/app/models/candidate';

@Component({
  selector: 'app-candidate-delete',
  template: `
  <div class="modal-header">
    <h5 class="modal-title">Delete Candidate</h5>
    <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss()">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  <div class="modal-body">
    <div class="row">
      <div class="col">
        <h6>Are you sure?</h6>
        <p>Are you sure you want to delete the Client <strong class="font-weight-bold">"{{candidate.first_name}} {{candidate.last_name}}"?</strong></p>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <button type="button" class="btn btn-danger" (click)="activeModal.close({result: true, id: candidate.id})">Confirm</button>
    <button type="button" class="btn btn-primary" (click)="activeModal.dismiss()">Cancel</button>
  </div>
`
,
styles: []
})
export class CandidateDeleteComponent implements OnInit {


  @Input() candidate: Candidate;
  @Output() deleteEvt = new EventEmitter<null>();

  constructor(public activeModal: NgbActiveModal) { }
  ngOnInit(){
  }

  delete() {
    this.deleteEvt.emit(null)
  }

}
