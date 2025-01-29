import { Component, OnInit, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalStack } from '@ng-bootstrap/ng-bootstrap/modal/modal-stack';
import { NgbModalWindow } from '@ng-bootstrap/ng-bootstrap/modal/modal-window';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Mail } from 'src/app/models/mail';
import { CustomField } from 'src/app/models/custom-field';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { RouteReuseStrategy } from '@angular/router'
import { CampaignService } from 'src/app/services/campaign/campaign.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-custom-fields',
  templateUrl: './add-custom-fields.component.html',
  styleUrls: ['./add-custom-fields.component.scss']
})
export class AddCustomFieldsComponent implements OnInit {

  @ViewChild('closebutton') closebutton;

  @Input() vendorIdArray;
  @Input() eventId;

  @Output() refreshListEvt = new EventEmitter<any>();
  sub: Subscription;
  constants = Constants;
  formData: any;
  customField = {} as CustomField;
  variableTypes = [
    "CHAR",
    "VARCHAR",
    "TINYTEXT",
    "TEXT",
    "BLOB",
    "MEDIUMTEXT",
    "MEDIUMBLOB",
    "LONGTEXT",
    "LONGBLOB",
    "TINYINT",
    "SMALLINT",
    "MEDIUMINT",
    "INT",
    "BIGINT",
    "FLOAT",
    "DOUBLE",
    "DECIMAL",
    "DATE",
    "DATETIME",
    "TIMESTAMP",
    "TIME",
    "YEAR"


  ]
  tagName = Constants.VENDOR_LIST;
  api_path = APIPath.CUSTOM_FIELDS;
  constructor(private service: APIProviderService<CustomField>,
    private router: Router,
    private campaignService: CampaignService,
    public activeModal: NgbActiveModal) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    // this.vendorList.list_data = this.vendorIdArray;
    // this.vendorList.list_size = this.vendorIdArray.length;
    // this.vendorList.list_description = '';
    // this.vendorList.template_name = null;
  }

  ngOnChanges(): void {
    // this.vendorList.list_data = this.vendorIdArray;
    // this.vendorList.list_size = this.vendorIdArray.length;

  }

  onSubmit() {
    this.formData = new FormData();
      this.formData.append("field_name", this.customField.field_name);
      this.formData.append('field_type', this.customField.field_type);
      this.formData.append("field_size", this.customField.field_size);
      this.formData.append('field_desc', this.customField.field_desc);
      this.formData.append('data_type', "mass_email");
      this.formData.append('field_scope', "Custom");
      this.sub = this.campaignService
      .postCustomField(this.formData)
      .subscribe((res: any) => {
        this.customField = {} as CustomField;
        this.formData = {} as FormData;

        this.refreshListEvt.emit(null);
        this.closebutton.nativeElement.click();
        this.router.navigate(['/home/campaign/custom-fields']);
      });
  }
}
