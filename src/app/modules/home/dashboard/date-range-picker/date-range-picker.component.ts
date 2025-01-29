import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';

@Component({
  selector: 'app-date-range-picker',
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Select Date Range</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="col-sm-12 col-md-12 col-lg-6 col-xl-6 form-group">
          <div class="input-group input-group-sm date-range-input">
            <input class="form-control" placeholder="{{startDate | date: 'MM/dd/yyyy'}}" value="startDate" ngbDatepicker #d1="ngbDatepicker" [(ngModel)]="startDate"
              #c1="ngModel" name="startDate" [readonly]="true" (click)="d1.toggle()">
            <div class="input-group-append">
              <a class="input-group-text" (click)="d1.toggle()">
                <i class="far fa-calendar-minus"></i>
              </a>
            </div>
          </div>
        </div>
        <div class="col-sm-12 col-md-12 col-lg-6 col-xl-6 form-group">
          <div class="input-group input-group-sm date-range-input">
            <input class="form-control" placeholder="{{endDate | date: 'MM/dd/yyyy'}}" ngbDatepicker #d2="ngbDatepicker" [(ngModel)]="endDate"
              #c2="ngModel" name="endDate"  [readonly]="true" (click)="d2.toggle()">
            <div class="input-group-append">
              <a class="input-group-text" (click)="d2.toggle()">
                <i class="far fa-calendar-minus"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
    <button type="button" class="btn btn-danger" (click)="activeModal.dismiss()">Cancel</button>
      <button type="button" class="btn btn-primary" (click)="confirm()">Confirm</button>
    </div>
  `,
  styles: [],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class DateRangePickerComponent implements OnInit {

  // startDate: any;
  // endDate: any;
  @Input() startDate;
  @Input() endDate;
  // startDate: string=moment(new Date()).format('YYYY-MM-DD');
  // endDate: string=moment(new Date()).format('YYYY-MM-DD');
  constructor(
    public activeModal: NgbActiveModal
  ) {

  }

  ngOnInit(): void {
    // this.startDate={year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate()};
    //this.startDate= moment(new Date()).format('MM/DD/YYYY');
    console.log(this.startDate)
  }

  confirm(): void {
    this.activeModal.close({ startDate: this.startDate, endDate: this.endDate });
  }

}