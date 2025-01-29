import { Component, OnInit, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalStack } from '@ng-bootstrap/ng-bootstrap/modal/modal-stack';
import { NgbModalWindow } from '@ng-bootstrap/ng-bootstrap/modal/modal-window';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Mail } from 'src/app/models/mail';
import { VendorList } from 'src/app/models/vendor-list';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { RouteReuseStrategy } from '@angular/router'

@Component({
  selector: 'app-create-vendor-list',
  templateUrl: './create-vendor-list.component.html',
  styleUrls: ['./create-vendor-list.component.scss']
})
export class CreateVendorListComponent implements OnInit {

  @ViewChild('closebutton') closebutton;

  @Input() vendorIdArray;
  @Input() eventId;

  @Output() refreshListEvt = new EventEmitter<any>();

  constants = Constants;
  formData: any;
  vendorList = {} as VendorList;
  tagName = Constants.VENDOR_LIST;

  constructor(private service: APIProviderService<VendorList>,
    private router: Router,
    public activeModal: NgbActiveModal) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.vendorList.list_data = this.vendorIdArray;
    this.vendorList.list_size = this.vendorIdArray.length;
    this.vendorList.list_description = '';
    this.vendorList.template_name = null;
  }

  ngOnChanges(): void {
    this.vendorList.list_data = this.vendorIdArray;
    this.vendorList.list_size = this.vendorIdArray.length;

  }

  onSubmit() {
    this.formData = new FormData();
    this.formData.append('list_description', this.vendorList.list_description);
    this.formData.append('list_name', this.vendorList.list_name);
    this.formData.append('list_size', this.vendorIdArray.length);
    this.formData.append('list_data', this.vendorIdArray);
    this.formData.append("template_name", this.vendorList.template_name);
    console.log(this.formData.get('list_data'))

    this.service.createCollectionItem(APIPath.VENDOR_LIST, this.formData)
      .subscribe((res: any) => {
        this.vendorList = {} as VendorList;
        this.formData = {} as FormData;
        console.log(this.formData)
        console.log(this.vendorList)
        this.refreshListEvt.emit(null);
        this.closebutton.nativeElement.click();
        this.router.navigate(['/home/vendors/vendor-list']);
      });
  }
}