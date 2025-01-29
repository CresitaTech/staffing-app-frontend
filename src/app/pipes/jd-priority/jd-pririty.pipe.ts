import { Pipe, PipeTransform } from '@angular/core';
import { JobDescription } from 'src/app/models/job-description';

@Pipe({
  name: 'jdPririty'
})
export class JdPrirityPipe implements PipeTransform {

  transform(jobDescription: JobDescription[], priority: boolean) {
    return jobDescription.filter(jd => {
    //  console.log(jd);

      if(jd.priority===true){
        return jd; 
    }} );
  }
}


