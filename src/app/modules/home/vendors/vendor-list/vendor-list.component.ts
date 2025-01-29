import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { CustomFilterInterface } from 'src/app/models/filters';
import { VendorList } from 'src/app/models/vendor-list';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Constants } from 'src/app/enums/constants.enum';
import { APIPath } from 'src/app/enums/api-path.enum';
import { CreateVendorListComponent } from '../create-vendor-list/create-vendor-list.component';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { Router } from '@angular/router';



const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false };
@Component({
  selector: 'app-vendor-list',
  templateUrl: './vendor-list.component.html',
  styleUrls: ['./vendor-list.component.scss']
})
export class VendorListComponent extends CustomFilterModel<VendorList> implements OnInit, OnDestroy, CustomFilterInterface {

  api_path = APIPath.VENDOR_LIST;

  @ViewChild(FilterComponent) filter: FilterComponent;

  constants = Constants;
  eventId: string;
  indexAsInput;
  tagName;
  mailAddress: string;
  vendorId: string;
  listData: Array<string>;

  constructor(
    private service: APIProviderService<VendorList>,
    selectAllService: SelectAllService,
    private router: Router,
    private modalService: NgbModal
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
    this.fetchCollectionList();
    this.count = 0;
    // console.log(this.fetchCollectionList());
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

  // To open vendor list details page
  openListDetailsModel(listID: string): void {
    listID = listID.replace(/-/g, "")
    console.log(listID)
    this.router.navigateByUrl('home/vendors/vendor-list-details', {
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
      this.router.navigate(['/home/vendors/vendor-list']);
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

  // To edit a vendor list
  openEditVendorList(listName: string) {
    this.tagName = Constants.VENDOR_LIST;
    this.eventId = Constants.POP_UP;
    const modalRef = this.modalService.open(CreateVendorListComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.list_name = listName;
    modalRef.result.then(res => {
      this.refreshPage();
    });
  }

  sendMailToList(listId: string, templateId: string) {
    listId = listId.replace(/-/g, "")
    templateId = templateId.replace(/-/g, "")
    console.log(listId)
    console.log(templateId)
    this.service.getCollectionItemByListandTemplateId(APIPath.MAIL_VENDOR_LIST, listId, templateId).subscribe();
    this.router.navigate(['/home/vendors/vendor-list']);
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

  // Delete Vendor List Pop up
  openDeleteModel(listName: string, listID: string): void {
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.name = listName;
    modalRef.componentInstance.id = listID;
    modalRef.componentInstance.title = Constants.VENDOR_LIST;
    this.collection.forEach(item => {
      if (item.id === listID) { modalRef.componentInstance.name = item.list_name; }
    })
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteVendorList(res.id);
      }
    });
  }

  // Delete the selected list
  deleteVendorList(id: string) {
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
