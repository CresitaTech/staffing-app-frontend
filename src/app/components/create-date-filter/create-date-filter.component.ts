import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { Filter } from 'src/app/enums/filter.enum';

@Component({
    selector: 'app-create-date-filter',
    template: `
        <!-- Created -->
        <div class="card mb-2">
            <div class="card-body">
                <div class="row">
                    <div class="col">
                        <h6 class="card-title">Created At</h6>
                    </div>
                </div>
                <div class="form-row">
                    <div class="col-sm-12 col-md-12 col-lg-6 col-xl-6 form-group">
                        <div class="input-group input-group-sm">
                            <input class="form-control" placeholder="From Date" ngbDatepicker #d1="ngbDatepicker"
                                [ngModel]="startDate" (ngModelChange)="startDateChanged($event)" #c1="ngModel" name="filterEnum.START_DATE">
                            <div class="input-group-append">
                                <a class="input-group-text" (click)="d1.toggle()">
                                    <i class="far fa-calendar-minus"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-12 col-md-12 col-lg-6 col-xl-6 form-group">
                        <div class="input-group input-group-sm">
                            <input class="form-control" placeholder="To Date" ngbDatepicker #d2="ngbDatepicker"
                                [ngModel]="endDate" (ngModelChange)="endDateChanged($event)" #c2="ngModel" name="filterEnum.END_DATE">
                            <div class="input-group-append">
                                <a class="input-group-text" (click)="d2.toggle()">
                                    <i class="far fa-calendar-minus"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
    ],
    providers: [
        { provide: NgbDateAdapter, useClass: CustomDateAdapter },
        { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ]
})
export class CreateDateFilterComponent implements OnInit {

    filterEnum = Filter;
    @Input() startDate: string;
    @Output() startDateChange = new EventEmitter<string>();
    @Input() endDate: string;
    @Output() endDateChange = new EventEmitter<string>();

    constructor(
        private ngbCalendar: NgbCalendar,
        private dateAdapter: NgbDateAdapter<string>
    ) { }

    ngOnInit(): void {
    }

    get today() {
        return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
    }

    startDateChanged(event): void {
        this.startDateChange.emit(event);
    }
    endDateChanged(event): void {
        this.endDateChange.emit(event);
    }

}


/**
 * @component
 * app-filter-header
 */
@Component({
    selector: 'app-filter-header',
    template: `
        <div class="form-row  mb-3 heading-sec">
            <div class="col">
                <h5 class="card-title">Filters</h5>
            </div>
            <div class="col-auto">
                <button type="button" class="btn btn-outline-primary" (click)="clearFilter()">Clear all filters</button>
            </div>
            <div class="col-auto">
                <button type="button" class="btn btn-primary" (click)="applyFilters()">Apply Filters</button>
            </div>
        </div>
    `
})
export class FilterHeader {

    @Output() clearFilterEvt = new EventEmitter<null>()
    @Output() applyFiltersEvt = new EventEmitter<null>()

    constructor() { }

    clearFilter() {
        console.log("calling clear");
        this.clearFilterEvt.emit();
    }
    applyFilters() {
        console.log("calling applyFilters");
        this.applyFiltersEvt.emit();
    }

}


/**
 * @component
 * app-filter-footer
 */
@Component({
    selector: 'app-filter-footer',
    template: `
        <div class="form-row button-sec">
            <div class="col"><button type="button" class="btn btn-block btn-outline-primary" (click)="clearFilter()">Clear all
                    filters</button></div>
            <div class="col">
                <button type="button" class="btn btn-block btn-primary" (click)="applyFilters()">Apply Filters</button>
            </div>
        </div>
    `
})
export class FilterFooter extends FilterHeader {

    @Output() clearFilterEvt = new EventEmitter<null>()
    @Output() applyFiltersEvt = new EventEmitter<null>()

    constructor() { super(); }
}
