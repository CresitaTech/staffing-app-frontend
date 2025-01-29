import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { vendor } from 'src/app/models/vendor';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { Paging } from 'src/app/classes/paging';
import { CustomFilterInterface } from 'src/app/models/filters';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { VendorImportComponent } from './vendor-import/vendor-import.component';
import { CreateVendorListComponent } from './create-vendor-list/create-vendor-list.component';
import { Router } from '@angular/router';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false };

@Component({
  selector: 'app-vendors',
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.scss']
})
export class VendorsComponent
  extends CustomFilterModel<vendor>
  implements OnInit, OnDestroy, CustomFilterInterface {

  api_path = APIPath.VENDORS;

  @ViewChild(FilterComponent) filter: FilterComponent;

  constants = Constants;
  eventId: string;
  indexAsInput;
  tagName;
  mailAddress: string;
  vendorId: string;
  vendorIdArray: Array<string> = [];

  constructor(
    service: APIProviderService<vendor>,
    private router: Router,
    selectAllService: SelectAllService,
    private modalService: NgbModal
  ) {
    super(service, selectAllService);
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.filterOn.push({ model: 'specialised_in' },
      { model: 'contact_person_first_name' },
      { model: 'contact_person_last_name' },
      { model: 'company_name' });
  }

  ngOnInit(): void {
    this.fetchCollectionList();
  }

  ngOnDestroy(): void {

  }

  // To open filter toggle
  openFilter(): void {
    this.filter.toggle();
  }

  // To remove the applied fitlers
  removeFilter(event: string): void {
    this.displayFilter.splice(this.displayFilter.findIndex((el: string) => el === event), 1);
    delete this.filter.filters[event];
    this.filter.sendFilterEvt();
  }

  // To open export slider
  openExport() {
    this.exportItem(APIPath.EXPORT_VENDORS);
  }

  //  To open import modal popup
  openImportModal() {
    const modalRef = this.modalService.open(VendorImportComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.result.then(res => {
      // alert("got it");
    });
  }


  openDeleteModel(userId: string): void {
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.id = userId;
    modalRef.componentInstance.title = Constants.VENDOR;
    this.collection.forEach(item => {
      if (item.id === userId) { modalRef.componentInstance.name = item.contact_person_first_name; }
    })
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteVendor(res.id);
      }
    });
  }

  deleteVendor(userId: string) {
    this.deleteCollectionItem(userId);
  }

  refreshPage() {
    this.closeAddVendor();
    this.fetchCollectionList();
  }

  refreshEmailPage() {
    this.indexAsInput = undefined;
    this.closeSendMail();
  }

  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    if (actionValue === "delete") {
      this.deleteSelectedLists();
      //console.log("fetched vendor Collection")
      this.router.navigate(['/home/vendors']);

    }
    else if (actionValue === "sendMail") {
      this.mailAddress = "";
      this.collectionMapForSelectFlag.forEach((value, key) => {
        if (value === true) {
          if (this.collectionMapForEmail.has(key))
            this.mailAddress = this.mailAddress + this.collectionMapForEmail.get(key) + ",";
          //console.log("*****mail"+this.mailAddress)
        }
      }
      )
      // this.collection.forEach((_)=>{
      //    if( _.isSelected){
      //     this.mailAddress=this.mailAddress+_.primary_email+",";
      //    // console.log("*****mail"+this.mailAddress)
      //    }
      // }
      // )
      this.mailAddress = this.mailAddress.substr(0, this.mailAddress.length - 1);
      this.openSendMail(this.mailAddress);
    }
    else if (actionValue === "createList") {
      this.vendorId = '';
      this.vendorIdArray = [];
      this.collectionMapForSelectFlag.forEach((value, key) => {
        if (value === true) {
          if (this.collectionMapForId.has(key)) {
            this.vendorId = this.collectionMapForId.get(key);
            this.vendorIdArray.push(this.vendorId);
          }
          //console.log(this.vendorIdArray)
        }
      }
      )
      this.openCreateNewVendorList(this.vendorIdArray);
    }
  }


  // Delete all the selected items
  deleteSelectedLists() {
    this.massDeleteSelectedCollectionItem()
  }

  // Open Create Vendor list Popup
  openCreateNewVendorList(vendorIdArray) {
    const modalRef = this.modalService.open(CreateVendorListComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.vendorIdArray = vendorIdArray;
    modalRef.componentInstance.tagName = Constants.VENDOR_LIST;
    modalRef.result.then(res => {
      modalRef.componentInstance.refreshListEvt.emit(null);
      this.router.navigate(['/home/vendors']);
    }, (error) => {
      console.log(error);
    });
  }

  // Open add vendor slider
  openAddVendor(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    document.getElementById("addVendor").style.width = "800px";
  }

  //Close add vendor slider
  closeAddVendor() {
    document.getElementById("addVendor").style.width = "0";
  }

  //To openSendMail for a single e-mail address
  singleMail(email) {
    this.mailAddress = "";
    this.mailAddress = this.mailAddress + email;
    this.openSendMail(this.mailAddress);
  }

  // Slide Send Mail
  openSendMail(mailString) {
    this.tagName = Constants.VENDOR;
    document.getElementById("sendMail").style.width = "800px";
  }

  // To Close Send Mail Pop-up      
  closeSendMail() {
    document.getElementById("sendMail").style.width = "0";
  }

}
