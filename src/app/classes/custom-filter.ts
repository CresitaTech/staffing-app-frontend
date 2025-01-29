import { Filter } from "../enums/filter.enum";
import * as moment from 'moment';
import { FilterObjectType } from "../models/filters";
import { Paging } from "./paging";
import { APIProviderService } from "../services/api-provider.service";
import { SelectAllService } from "../services/common/select-all.service";

export class CustomFilterModel<T> extends Paging<T> {


    displayFilter: Array<string>;
    filterOn: Array<FilterObjectType> = [{
        model: 'created_at',
        type: Filter.DATE_RANGE,
    }];

    constructor(
        _api: APIProviderService<T>,
        _selectAll: SelectAllService
    ) { 
        super(_api, _selectAll);
    }

}