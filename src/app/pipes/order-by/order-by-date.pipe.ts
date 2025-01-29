import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'orderByDate'
})
export class OrderByDatePipe implements PipeTransform {

  transform(data: Array<any>, ...args: any[]): Array<any> {
    if (!Array.isArray(data)) {
      return;
    }
    data.sort((a: any, b: any) => {
      if (moment(a[args[0]]) < moment(b[args[0]])) {
        return -1
      } else if (moment(a[args[0]]) > moment(b[args[0]])) {
        return 1
      } else {
        return 0;
      }
    });
    return args[1] === true ? data.reverse() : data;
  }

}
