import { FilterComponent } from "../components/filter/filter.component";
import { Filter } from "../enums/filter.enum";

/**
 * below interface is responsible reading filter component in other component
 * and enable opening filter slider and
 * removing filter from advanced filters
 */
export interface CustomFilterInterface {
    filter: FilterComponent;
    openFilter(): void
    removeFilter(filter: string): void
}

export interface FilterObjectType {
    model: string,
    type?: Filter,
    range?: RangeFilter
}

export interface RangeFilter {
    start: number
    end: number,
    param: string
}