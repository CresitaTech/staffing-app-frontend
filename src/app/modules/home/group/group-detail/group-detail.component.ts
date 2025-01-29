import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { GlobalApiResponse } from 'src/app/models/global_api_response';
import { Group } from 'src/app/models/group';
import { Permission } from 'src/app/models/permission';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  styles: [
  ]
})
export class GroupDetailComponent implements OnInit, OnDestroy {

  @Input() eventId: Constants;
  @Input() indexAsInput: string | number;
  @Output() refreshListEvt = new EventEmitter<{ isActionRequired: boolean, elementId: string }>()

  constants = Constants;
  @ViewChild('f') form: NgForm;
  collection_all: Array<Permission> = [];
  subscribe$: Subscription;
  editSubscribe$: Subscription;

  group = { permissions: [] } as Group;

  constructor(
    public activeModal: NgbActiveModal,
    private _api: APIProviderService<Group | Permission>
  ) { }

  ngOnInit(): void {
    console.log(this.eventId);
    if (this.eventId === Constants.EDIT) {
      this.getGroupById(this.indexAsInput);
    }
    this.getAllPermissions();
  }

  ngOnDestroy(): void {
    this.form.reset();
    if (this.editSubscribe$) this.editSubscribe$.unsubscribe();
    if (this.subscribe$) this.subscribe$.unsubscribe();
  }

  closeDetail(isActionRequired: boolean): void {
    if (this.eventId === Constants.POP_UP)
      if (isActionRequired)
        this.activeModal.close(true);
      else
        this.activeModal.dismiss()
    else
      this.refreshListEvt.emit({ isActionRequired, elementId: 'addGroup' });
  }


  onSave(isNew: boolean) {
    const permission = [];
    this.group.permissions.forEach(p => permission.push(p.id));
    this.group.permissions = permission;

    const request = isNew
      ? this._api.createCollectionItem(APIPath.GROUP, this.group)
      : this._api.putCollectionItemById(APIPath.GROUP, this.group.id, this.group);
    this.subscribe$ = request.subscribe(res => {
      this.closeDetail(true);
    })
  }


  getAllPermissions(): void {
    this._api.getReportWithApiLink(APIPath.PERMISSION)
      .subscribe((res: GlobalApiResponse<Permission>) => {
        this.collection_all = res.results;
      })
  }

  getGroupById(groupId: string | number): void {
    this.editSubscribe$ = this._api.getCollectionItemById(APIPath.GROUP, groupId)
      .subscribe((res: Group) => this.group = res);
  }

}
