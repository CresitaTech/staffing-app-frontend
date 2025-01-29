
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'enumConverter'
})
export class EnumConverterPipe implements PipeTransform {

  transform(value: string, ...args: string[]): string {
    return value.replace(/_/g, ' ');
  }

}
