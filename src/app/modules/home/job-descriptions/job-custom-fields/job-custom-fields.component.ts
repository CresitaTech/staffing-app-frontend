import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { CustomFilterInterface } from 'src/app/models/filters';
import { EmailList } from 'src/app/models/email-list';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Constants } from 'src/app/enums/constants.enum';
import { APIPath } from 'src/app/enums/api-path.enum';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { Router } from '@angular/router';
import { AddJobCustomFieldsComponent } from './add-job-custom-fields/add-job-custom-fields.component';
import { PredefinedPermissions } from 'src/app/enums/predefined-permissions';
import { Roles } from 'src/app/enums/role.enum';
import { Permission } from 'src/app/models/permission';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Subscription } from 'rxjs';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false };
@Component({
  selector: 'app-job-custom-fields',
  templateUrl: './job-custom-fields.component.html',
  styleUrls: ['./job-custom-fields.component.scss']
})
export class CustomJobFieldsComponent extends CustomFilterModel<EmailList> implements OnInit, OnDestroy, CustomFilterInterface {

  api_path = APIPath.CUSTOM_FIELDS;

  @ViewChild(FilterComponent) filter: FilterComponent;

  constants = Constants;
  eventId: string;
  indexAsInput;
  tagName;
  mailAddress: string;
  emailId: string;
  listData: Array<string>;
  roles = Roles;
  role: Roles;
  permissionSet = new Set<string>();
  predefined_permissions = PredefinedPermissions;
  roleSub$: Subscription;
  permissionSub$: Subscription;

  constructor(
    private service: APIProviderService<EmailList>,
    selectAllService: SelectAllService,
    private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
  ) {
    super(service, selectAllService);
    this.filterOn.push({ model: 'list_name' },
      { model: 'template_name' },
      { model: 'list_description' }
    );
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnDestroy(): void { this.count = 0; }

  ngOnInit(): void {
    this.getRole();
    this.getPermission();
    this.fetchCollectionList();
    this.count = 0;
    
    // console.log(this.fetchCollectionList());
  }


  getRole(): void {
    this.roleSub$ = this.auth.getRole()
      .subscribe((res: Roles) => {
        this.role = res;
      });
  }

  canLoad(): boolean {
    return this.role === Roles.ADMIN;
    
    
  }

  getPermission(): void {
    this.permissionSub$ = this.auth.getPermissions()
      .subscribe((res: Array<Permission>) => {
        if (res && res.length > 0) {
          this.makePermissionSet(res)
        }
      });
  }

  makePermissionSet(permissions: Array<Permission>): void {
    permissions = permissions.filter(f => {
      if (f.codename.indexOf('view_') !== -1) {
        this.permissionSet.add(f.codename);
      }
    });
  }

  // To open filter toggle
  openFilter(): void {
    this.filter.toggle();
  }

  // Open send mail slider
  openSendMail(mailString) {
    this.tagName = Constants.VENDOR_LIST;
    document.getElementById("sendMail").style.width = "800px";
  }

  // To open email list details page
  openListDetailsModel(listID: string): void {
    listID = listID.replace(/-/g, "")
    console.log(listID)
    // home/campaign/email-list-details
    this.router.navigateByUrl('home/campaign/campaign-details', {
      state: { "listId": listID }
    })
  }

  // For a single mail
  singleMail(email) {
    this.mailAddress = "";
    this.mailAddress = this.mailAddress + email;
    this.openSendMail(this.mailAddress);
  }

  // To remove filters
  removeFilter(event: string): void {
    this.displayFilter.splice(this.displayFilter.findIndex((el: string) => el === event), 1);
    delete this.filter.filters[event];
    this.filter.sendFilterEvt();
  }


  // Handler for dropdown with the go button
  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    if (actionValue === "delete") {
      this.deleteSelectedLists();
      this.fetchCollectionList();
      console.log("fetched Collection")
      this.router.navigate(['/home/job-descriptions/job-custom-fields']);
      this.fetchCollectionList();
    }
    else if (actionValue === "sendMail") {
      this.mailAddress = "";
      this.collectionMapForSelectFlag.forEach((value, key) => {
        if (value === true) {
          if (this.collectionMapForEmail.has(key))
            this.mailAddress = this.mailAddress + this.collectionMapForEmail.get(key) + ",";
          // console.log("*****mail"+this.mailAddress)
        }
      }
      )
      this.mailAddress = this.mailAddress.substr(0, this.mailAddress.length - 1);
      this.openSendMail(this.mailAddress);
    }
  }

  // To edit a email list
  openEditEmailList(listName: string) {
    this.tagName = Constants.VENDOR_LIST;
    this.eventId = Constants.POP_UP;
    // const modalRef = this.modalService.open(CreateEmailListComponent, {
    //   backdrop: 'static',
    //   centered: true,
    //   keyboard: false,
    // });
    // modalRef.componentInstance.list_name = listName;
    // modalRef.result.then(res => {
    //   this.refreshPage();
    // });
  }

  sendMailToList(campaindId: string, listId: string) {
    // console.log("sendMailToList")
    // console.log(templateId)
    // console.log(listId)
    // listId = listId.replace(/-/g, "")
    // templateId = templateId.replace(/-/g, "")
    // console.log(listId)
    // console.log(templateId)
    this.service.getCollectionItemByListandTemplateId(APIPath.SEND_CAMPAIGN_EMAIL, campaindId, listId).subscribe();
    this.router.navigate(['/home/job-descriptions/job-custom-fields']);
  }

  resendList(listId: string, listName: string, size: any) {
    // var modalRef = this.modalService.open(CreateEmailCampaignComponent, _NgbModalOptions);
    // modalRef.componentInstance.campaignListId = listId;
    // modalRef.componentInstance.campaignListName = listName;
    // modalRef.componentInstance.campaignListSize = size;
    // modalRef.result.then(res => {
    //   // if (res.result) {
    //   //   this.deleteCollectionItem(res.id);
    //   // }
    // });
  }

  // Refresh operations
  // 1. Page
  refreshPage(): void {
    this.fetchCollectionList();
  }

  // 2. Email
  refreshEmailPage() {
    this.indexAsInput = undefined;
    this.closeSendMail();
  }

  doAction() {
 
    var modalRef = this.modalService.open(AddJobCustomFieldsComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });

    modalRef.result.then(res => {
      // if (res.result) {
      //   this.deleteCollectionItem(res.id);
      // }
    });
  }


  // Delete Email List Pop up
  openDeleteModel(fieldName: string, fieldID: string): void {
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.name = fieldName;
    modalRef.componentInstance.id = fieldID;
    modalRef.componentInstance.title = Constants.CUSTOM_FIELD;
    
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteEmailList(res.id);
      }
    });
  }

  // Delete the selected list
  deleteEmailList(id: string) {
    this.deleteCollectionItem(id);
  }

  // Delete all the selected lists
  deleteSelectedLists() {
    this.deleteSelectedCollectionItem()
  }

  // Close send mail slider
  closeSendMail() {
    document.getElementById("sendMail").style.width = "0";
  }
}
