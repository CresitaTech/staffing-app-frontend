import { EventEmitter } from "@angular/core";
import { NgbCalendar, NgbDateAdapter } from "@ng-bootstrap/ng-bootstrap";
import { Filter } from "../enums/filter.enum";

export interface CustomDetailFilterInterface {
    items: Array<any>,
    params: Array<string>,
    filterEvt: EventEmitter<any>,
    clearFilters(): void
    applyFilters(): void
}

export class CustomDetailFilter {

    filters: Object = {};
    selectedFilter: Object = {};
    filterEnum = Filter;

    constructor() { }

    protected createFilter(params: Array<string>, items: Array<any>): void {
        params.forEach((param: string) => {
            if ((param.indexOf('_date') === -1)) {
                this.filters[param] = new Set<{ id: string }>();
                items.forEach(item => {
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

}
