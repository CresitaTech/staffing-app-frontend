import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { FilterSearch } from 'src/app/models/filterSearch';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-filter-search-dropdown',
  template: `
    <div class="col">
      <ng-select
        #selectFilter
        [items]="collection"
        [searchable]="false"
        [(ngModel)]="item"
        (ngModelChange)="change($event);"
        bindLabel="bdm_name"
        bindValue="bdm_name"
        placeholder="Select {{ role }}"
        (clear)="change(null);"
        style="margin: 0 auto; width:200px;"
        #_item="ngModel"
        [ngClass]="{ 'is-invalid': _item.invalid && _item.touched }"
      >
        <ng-template ng-header-tmp>
          <input
            style="width: 100%; line-height: 24px"
            type="text"
            (input)="selectFilter.filter($event.target.value)"
          />
        </ng-template>
      </ng-select>
    </div>
  `,
  styles: [],
})
export class FilterSearchDropdown {
  api_path = APIPath.USER_ROLE;

  constructor(protected _api: APIProviderService<FilterSearch>) {}

  @Input() item: string;
  @Output() changeItemEvt = new EventEmitter<string>();
  @Output() changeItemAllData = new EventEmitter<any>();
  private getSub: Subscription;
  @Input() user_role: string;
  @Input() role: string;
  collection: any = [];
  showAllCountriesFlag = false;

  ngOnInit(): void {
    console.log('FilterSearchDropdown');
    this.getList();
  }

  ngOnDestroy(): void {}

  getList(): void {
    var apiPath = `${this.api_path}${this.user_role}`;
    if (this.role === 'Country') {
      apiPath = `/users/countries/`;
    }

    this.getSub = this._api.getReportWithApiLink(`${apiPath}`).subscribe((res) => {
      if (this.role === 'Country' && !this.showAllCountriesFlag) {
        var cData = [];

        for (var _i = 0; _i < res.length; _i++) {
          var num = res[_i];
          console.log("india jitega");
          console.log(num);
          if (num.country_code === 'India' || num.country_code === 'US') {
            cData.push({ id: num.country_code, bdm_name: num.country_code });
          }
        }
        console.log("india jitega1");
        console.log(cData);
        console.log("india jitega2");
        this.collection = cData;
        this.collection.push({ id: 'more', bdm_name: 'more...' });
      } else if(this.role === 'Country' && this.showAllCountriesFlag){
        var cData = [];

        for (var _i = 0; _i < res.length; _i++) {
          var num = res[_i];
          console.log("india jitega");
          console.log(num);
          if (num.country_code === 'India' || num.country_code === 'US') {
            cData.push({ id: num.country_code, bdm_name: num.country_code });
          }else{
            cData.push({ id: num.country_code, bdm_name: num.country_name });
          }
        }
        this.collection = cData;
        // this.collection.sort((a, b) => a.bdm_name.localeCompare(b.bdm_name));
      }else {
        this.collection = res;
      }
      console.log('this.collection india');
      console.log(this.collection);
      this.collection.unshift({ id: undefined, bdm_name: 'ALL' });
      this.changeItemAllData.emit(this.collection);
      console.log('this.collection');
      // console.log(this.collection);
    });
  }

  change(event): void {
    console.log(event + ' change');

    if (event === 'more...') {
      // Handle the "more..." action, for example, show the rest of the countries
      // this.showAllCountries();
      this.showAllCountriesFlag = true;
      this.getList();
      // this.emitChange(event);
    } else {
      this.emitChange(event);
    }
  }


  emitStage(str) {
    // var temp = this.collection.filter(_ => {
    //   if (_.id === str) {
    //     return _;
    //   }
    // })
    // this.emitStageName.emit(temp);
  }

  emitChange(event): void {
    //console.log('event: ' + event)
    this.changeItemEvt.emit(event);
    this.emitStage(event);
  }
}
