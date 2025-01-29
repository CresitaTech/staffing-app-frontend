import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Candidate } from 'src/app/models/candidate';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { Filter } from 'src/app/enums/filter.enum';

@Component({
  selector: 'app-candidate-filters',
  templateUrl: './candidate-filters.component.html',
  styleUrls: ['./candidate-filters.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class CandidateFiltersComponent implements OnInit {

  @Input() items: Array<Candidate>;
  @Input() params: Array<string>;
  @Output() filterEvt = new EventEmitter<Object>();
  filters: Object = {};
  selectedFilter: Object = {};
  filterEnum = Filter;

  constructor(
    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>
  ) { }

  ngOnInit(): void {
    this.createFilter()
  }

  private createFilter(): void {
    this.params.forEach((param: string) => {
      if ((param.indexOf('_date') === -1)) {
        this.filters[param] = new Set<{ id: string }>();
        // this.selectedFilter[param] = [];
        this.items.forEach(item => {
          if (item[param]) this.filters[param].add(item[param]);
        })
      }
    })
    Object.keys(this.filters).forEach(key => {
      if ((key.indexOf('_date') === -1)) {
        this.filters[key] = [...this.filters[key]] // converting sets to array
        this.filters[key] = this.filters[key].map(f => f = { id: f });
      }
    })
  }

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }

  clearFilters() {
    this.selectedFilter = {};
    this.applyFilters();
  }

  applyFilters() {
    this.sendFilterEvt(this.selectedFilter);
  }

  private sendFilterEvt(filterData: Object) {
    console.log(filterData);
    this.filterEvt.emit(filterData);
  }

}
