import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'submissionDate'
})
export class SubmissionDatePipe implements PipeTransform {

  datePipe: DatePipe = new DatePipe('en-US');


  transform(userdate: string) {
    var date = new Date();
    var transformDate = this.datePipe.transform(userdate, 'yyyy-MM-dd H:i:s');
    return transformDate;
  }


}
