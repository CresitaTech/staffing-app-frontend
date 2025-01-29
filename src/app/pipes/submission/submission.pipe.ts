import { Pipe, PipeTransform } from '@angular/core';
import { User } from 'src/app/models/user';

@Pipe({
  name: 'submission'
})
export class SubmissionPipe implements PipeTransform {

  transform(user: User[]) {
    return user.filter(user => {
     // console.log(user);
      if(user.groups[0]!=undefined){
      if(user.groups[0].name==="RECRUITER" || user.groups[0].name==="RECRUITER MANAGER"){
        return user;
      }}
    }
    )
  }

}
