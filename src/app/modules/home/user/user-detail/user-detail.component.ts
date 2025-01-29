import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { GlobalApiResponse } from 'src/app/models/global_api_response';
import { Group } from 'src/app/models/group';
import { Permission } from 'src/app/models/permission';
import { User } from 'src/app/models/user';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { GroupDetailComponent } from '../../group/group-detail/group-detail.component';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

const _NgbModalOptions: NgbModalOptions = {
  backdrop: 'static',
  centered: true,
  keyboard: false,
  size: 'lg'
}

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styles: [
    `
      .with-border{ border: 1px solid #e8e8f7; }

     
    `
  ]
})
export class UserDetailComponent implements OnInit, OnDestroy {

  @Input() eventId: Constants;
  @Input() indexAsInput: number;
  @Output() refreshListEvt = new EventEmitter<{ isActionRequired: boolean, elementId: string }>()

  constants = Constants;
  public countries: any;
  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings;

  togglePassword: boolean = false;
  ctogglePassword: boolean = false;
  @ViewChild('f') form: NgForm;
  @ViewChild('fe') formElement: ElementRef;
  user = {
    groups: [],
    user_permissions: [],
    is_active: true,
    is_deleted: false
  } as User;
  selectedGroup: number;
  available_all: Array<Permission> = [];
  groups_all: Array<Group> = []
  user_countries = [];
  submitted: boolean = false;
  file: File;
  subscribe$: Subscription;
  readGroupSub$: Subscription;
  readUserSub$: Subscription;
  readPermissionSub$: Subscription;

  constructor(
    private _api: APIProviderService<any>,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal
  ) {
    this.user.country = '';
    this.user.send_notification = 'yes';
  }

  ngOnInit(): void {
    if (this.eventId === Constants.EDIT || this.eventId === Constants.EDIT_POP_UP) {
      this.getUserById(this.indexAsInput);
    }
    this.getAllPermissions();
    this.getAllGroups();
    this.getAllPermissions();
    this.getCountriesList();
    this.selectedItems = [];
    this.dropdownSettings = {
      singleSelection: false,
      enableCheckAll: false,
      idField: 'id',
      textField: 'country_name',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      itemsShowLimit: 3,
      allowSearchFilter: true
    };

  }

  ngOnDestroy(): void {
    this.form.reset();
    if (this.subscribe$) this.subscribe$.unsubscribe();
    if (this.readGroupSub$) this.readGroupSub$.unsubscribe();
    if (this.readPermissionSub$) this.readPermissionSub$.unsubscribe();
    if (this.readUserSub$) this.readUserSub$.unsubscribe();
  }

  onItemSelect(item: any) {

    item.country_code = item.country_name.split("-")[0];
    item.country_name = item.country_name.split("-")[1];
    console.log(item)
    this.user_countries.push(item)
    this.user['user_countries'] = this.user_countries
    console.log(this.user['user_countries'])
    this.user.country = item.country_name.split("-")[1];
    console.log(this.user_countries)
    //console.log(item);
  }

  onItemDeSelect(item: any) {
    console.log(item)
    this.user_countries.forEach((country, index) => {
      if (country.id === item.id) this.user['user_countries'].splice(index, 1);
    });
    this.user_countries = this.user['user_countries']
    console.log(this.user['user_countries'])
    //console.log(this.user_countries)
    //console.log(this.user.country)
  }


  onSelectAll(items: any) {
    //console.log(items);
    //if (this.user_countries)
    //  items.array.forEach(item => {
    //    this.user_countries.push(item)
    //  });
  }

  closeDetail(isActionRequired: boolean): void {
    if (this.eventId === Constants.POP_UP || this.eventId === Constants.EDIT_POP_UP)
      if (isActionRequired)
        this.activeModal.close(true);
      else
        this.activeModal.dismiss()
    else
      this.refreshListEvt.emit({ isActionRequired, elementId: 'addUser' });
  }

  getCountriesList(): void {
    this._api.getListAPI(APIPath.COUNTRIES).subscribe(res => {
      // console.log(res)
      this.countries = res;
      this.countries.forEach(_ => {
        _.country_name = _.country_code + "-" + _.country_name
      });
      //this.countries = res;
      //console.log(this.countries)
    })
  }

  onSave(isNew: boolean) {
    this.submitted = true;
    //console.log(this.user)
    if (this.form.valid) {
      this.user.username = this.user.email;
      /* const formData: FormData = new FormData();
      this.user.username = this.user.email;
      // getting ids of groups and appending in formdata
      formData.append('groups[]', `${this.selectedGroup}`);
      if (this.user.user_permissions.length > 0) { // getting ids of user permissions and appending in formdata
        this.user.user_permissions.forEach(p => {
          formData.append('user_permissions[]', JSON.stringify(p.id))
        });
      }
      if (this.file) { // getting file and appending in formdata
        formData.append('avatar', this.file)
      }
      Object.keys(this.user).forEach(k => { // adding data in formdata
        if (k !== 'confirmPassword')
          if (this.user[k] && typeof this.user[k] !== 'object')
            formData.append(k, this.user[k]);
      }) */
      const new_user = {};

      new_user['is_active'] = this.user.is_active
      new_user['user_countries'] = this.user_countries;
      new_user['groups'] = [this.selectedGroup]
      new_user['country'] = this.user.country
      if (this.user.user_permissions.length > 0) {
        new_user['user_permissions'] = [];
        this.user.user_permissions.forEach(p => {
          new_user['user_permissions'].push(p.id)
        });
      }
      //console.log(this.user)
      Object.keys(this.user).forEach(k => {
        if (k !== 'confirmPassword')
          if (this.user[k] && typeof this.user[k] !== 'object') {
            new_user[k] = this.user[k];
            //console.log(this.user[k])
          }
      })

      console.log(new_user)

      const request = isNew
        ? this._api.createCollectionItem(APIPath.USERS, new_user)
        : this._api.putCollectionItemById(APIPath.USERS, this.user.id, new_user);
      this.subscribe$ = request.subscribe(res => {
        this.closeDetail(false);
      });
    }
  }

  getUserById(id: string | number): void {
    console.log("getUserById");
    this.readUserSub$ = this._api.getCollectionItemById(APIPath.USERS, id)
      .subscribe(res => {
        this.user = res;
        // console.log("User complete Object " + JSON.stringify(res))
        console.log("User complete Object " + this.user['country'])
        // this.user['user_countries'].forEach(_ => {
        //   delete _.user
        //   this.user_countries['country_name'] = _.country_name;
        //   this.user_countries['id'] = _.id;
        //   this.user.country = _.country_code;
        // })
        //this.user_countries = this.user['user_countries']
        // this.user.country = _.country;
        console.log("Fecting user data")
        console.log(this.user['country'])
        console.log(this.user_countries)

        console.log(this.user.groups[0].id)
        this.selectedGroup = this.user.groups[0].id
      });
  }

  getAllGroups(): void {
    this.readGroupSub$ = this._api.getReportWithApiLink(APIPath.GROUP)
      .subscribe((res: any) => this.groups_all = res)
  }

  getAllPermissions(): void {
    this.readPermissionSub$ = this._api.getReportWithApiLink(APIPath.PERMISSION)
      .subscribe((res: GlobalApiResponse<Permission>) => this.available_all = res.results)
  }

  openAddGroup(): void {
    const modalRef = this.modalService.open(GroupDetailComponent, _NgbModalOptions);
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {
      console.log(res);
      this.getAllGroups()
    });
  }

  readFile(event) {
    this.file = (<HTMLInputElement>event.target).files[0];
  }

}
