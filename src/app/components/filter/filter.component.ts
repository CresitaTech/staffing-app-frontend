import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { Filter } from 'src/app/enums/filter.enum';
import { FilterObjectType } from 'src/app/models/filters';
import { APIPath } from 'src/app/enums/api-path.enum';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styles: [`
    .sideFilters{ width: 500px; margin-right: -500px; }
    .filter-open { margin-right: 0px; }
  `],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class FilterComponent {
  @Input() allNewJobs: Boolean;
  @Input() allNewJobsClient: Boolean;

  @Input() params?: Array<FilterObjectType>;
  @Input() isDialog?: Boolean;
  @Output() filterEvt = new EventEmitter<{ path: string, displayFilter: Array<string> }>();
  path: string = '';
  filters: Object = {};
  filterEnum = Filter;
  public countries: any;
  public commonStatus: any;
  constructor(private _api: APIProviderService<FilterComponent>) { }



  clearFilters() { this.filters = {}; this.sendFilterEvt(); }
  toggle(): void { document.getElementById('filters').classList.toggle('filter-open'); }
  sendFilterEvt() {
    this.path = '';
    if (this.filters[this.filterEnum.DATE_RANGE] === 'custom') {
      delete this.filters[this.filterEnum.DATE_RANGE]
    } else {
      delete this.filters[this.filterEnum.START_DATE]
      delete this.filters[this.filterEnum.END_DATE]
    }
    const displayFilterSet = new Set<string>();
    Object.keys(this.filters).forEach(f => {
      if (this.filters[f] !== undefined && this.filters[f] !== null && this.filters[f] !== '') {
        this.path += `&${f}=${this.filters[f]}`
        displayFilterSet.add(f);
      }
    });
    this.filterEvt.emit({ path: this.path, displayFilter: Array.from(displayFilterSet) })
  }
  getCountriesList(): void {
    this._api.getListAPI(APIPath.COUNTRIES).subscribe(res => {
      this.countries = res;
      console.log(this.countries)
    })
  }

  getStatus(): void {
    if (this.allNewJobs) {
      this.commonStatus = [
        { id: 'Active', stage_name: 'Active' },
        { id: 'Inactive', stage_name: 'In Active' },
        { id: 'Rejected', stage_name: 'Rejected' },
        { id: 'SubmissionNotAccepted', stage_name: 'Not Accepting Submissions' },
        { id: 'RejectedForRate', stage_name: 'Rejected for Rate' }
      ];
    } else{
      this._api.getListAPI(APIPath.CANDIDATE_STAGES + '?ordering=-created_at&offset=0&limit=25').subscribe(res => {
        this.commonStatus = res.results;
        console.log(this.commonStatus)
      })
    }
  }


  ngOnChanges() {
    console.log("this.isDialog");

    console.log(this.isDialog);
    for(let i =0; i < this.params.length ; i++){
      if(this.params[i].model == "country"){
        this.getCountriesList();
        break;
      }
    }
    for(let i =0; i < this.params.length ; i++){
      if(this.params[i].model == "stage" || this.params[i].model == "status"){
        this.getStatus();
        break;
      }
    }

  }

}




@Component({
  selector: 'app-min-max-range',
  template: `
    <div class="form-group">
      <input class="form-control" type="number" name="param"
      [ngModel]="param" (ngModelChange)="emit($event)"
      placeholder="{{placeholder}}" #el="ngModel" [ngClass]="{ 'is-invalid': el.invalid && el.touched }" />
    </div>
  `,
})
export class MinMaxRange {

  @Input() placeholder: string;
  @Output() changed = new EventEmitter<number>();
  param: number;

  constructor() { }

  emit(event: number): void {
    this.changed.emit(event);
  }

}
