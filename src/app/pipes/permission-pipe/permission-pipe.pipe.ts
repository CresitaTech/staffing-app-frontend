import { Pipe, PipeTransform } from '@angular/core';
import { Group } from 'src/app/models/group';
import { Permission } from 'src/app/models/permission';

@Pipe({
  name: 'permissionPipe'
})
export class PermissionPipePipe implements PipeTransform {

  transform(value: Permission, ...args: any[]): string {
    return value ? `${value.content_type.app_label} | ${this.getDefaultValues(value.content_type.model)} | ${value.codename.substring(0, value.codename.indexOf('_'))}` : '';
  }
  // 

  getDefaultValues(model: string): string {
    switch (model) {
      case 'logentry': return 'log entry';
      case 'emailtemplate': return 'email template';
      case 'tokenproxy': return 'token proxy';
      case 'activitystatusmodel': return 'activity status model';
      case 'candidatessubmissionmodel': return 'candidates submission model';
      case 'emailtemplatemodel': return 'email template model';
      case 'mailmodel': return 'mail model';
      case 'placementcardmodel': return 'placement card model';
      case 'rtrmailmodel': return 'rtr mail model';
      case 'searchtermmodel': return 'search term model';
      case 'candidatesrepositerymodel': return 'candidates repositery model';
      case 'candidatesdocumentrepositery': return 'candidates document repositery';
      case 'clientmodel': return 'client model';
      case 'feedbackmodel': return 'feedback model';
      case 'designationmodel': return 'designation model';
      case 'interviewersmodel': return 'interviewers model';
      case 'timeslotsmodel': return 'timeslots model';
      case 'interviewsmodel': return 'interviews model';
      case 'sourcemodel': return 'source model';
      case 'zoomobject': return 'zoom object';
      case 'jobassingmentmodel': return 'job assingment model';
      case 'jobmodel': return 'job model';
      case 'jobsubmissionmodel': return 'job submission model';
      case 'vendoremailtemplatemodel': return 'vendor email template model';
      case 'vendormailmodel': return 'vendor mail model';
      case 'vendormodel': return 'vendor model';
      default: return model;
    }
  }

}


@Pipe({
  name: 'permissionFilterPipe'
})
export class PermissionFilterPipe implements PipeTransform {
  transform(items: Array<Permission>, ...args: string[]): Array<Permission> {
    if (args[0])
      return items.filter(item => {
        if (item.content_type.app_label.toLowerCase().indexOf(args[0].toLowerCase()) !== -1
          || item.content_type.model.toLowerCase().indexOf(args[0].toLowerCase()) !== -1
          || item.codename.toLowerCase().indexOf(args[0].toLowerCase()) !== -1)
          return item;
      })
    else return items;
  }
}


@Pipe({
  name: 'groupFilterPipe'
})
export class GroupFilterPipe implements PipeTransform {
  transform(items: Array<Group>, ...args: string[]): Array<Group> {
    return items.filter(item => item.name.toLowerCase().indexOf(args[0].toLowerCase()) !== -1);
  }
}