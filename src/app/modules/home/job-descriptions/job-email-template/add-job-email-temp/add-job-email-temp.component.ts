import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { EmailTemplate } from 'src/app/models/email-template';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { EditorChangeContent, EditorChangeSelection } from 'ngx-quill';
import { CampaignService } from 'src/app/services/campaign/campaign.service';
@Component({
  selector: 'app-add-job-email-temp',
  templateUrl: './add-job-email-temp.component.html',
  styleUrls: ['./add-job-email-temp.component.scss']
})
export class AddJobEmailTempComponent extends Paging<EmailTemplate> implements OnInit, OnChanges {

  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;
  csvFields: Array<any> = [];

  selectedType?= null;
  emailTemplate = {} as EmailTemplate;
  constants = Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;
  api_path = APIPath.VENDOR_TEMPLATE;
  customFields: Array<any> = [];
  addedFields: Array<any> = [];

  // addedKeys: Array<any> = [];
  totalKeys = 0;
  // addedValues: Array<any> = [];
  mappedFields?: Map<any, any> = new Map<any, any>();
  mappedFieldsValues?: Map<any, any> = new Map<any, any>();
  editorText: string;

  constructor(
    private service: APIProviderService<EmailTemplate>,
    _selectAll: SelectAllService,
    private campaignService: CampaignService,

    public activeModal: NgbActiveModal,
  ) { super(service, _selectAll) }

  ngOnInit(): void {

    this.emailTemplate.template_type = null;
    this.loadCustomFields();
    this.changeType('CANDIDATE');
    this.mappedFields.set(0, null);
    this.mappedFieldsValues.set(0, null);
    // this.totalKeys++;
  }

  ngOnChanges(): void {
    console.log("ngOnChanges");
    if (this.indexAsInput != undefined) {
      this.getTemplateById(this.indexAsInput);
    }

  }
  addField(key) {
    
    this.totalKeys++;
    this.mappedFields.set(key+1, null);
    this.mappedFieldsValues.set(key+1, null);
    console.log(this.mappedFields);
    console.log(this.mappedFieldsValues);
    console.log(this.totalKeys);
  }
  valueInMap(key, value) {
    var isValueUsed = false;

    for (let val of Array.from(this.mappedFields.values())) {
      // console.log("val");
      // console.log(val);
      if (val === value) {

        isValueUsed = true;
      }
    }

    if (isValueUsed) {

      return true;
    }


    return false;
  }
  deleteMap(key){
    this.mappedFields.delete(key);
    this.mappedFieldsValues.delete(key);
    this.totalKeys--;

    console.log(this.mappedFields);
    console.log(this.mappedFieldsValues);
    console.log(this.totalKeys);
  }
  valueInVMap(key, value) {
    var isValueUsed = false;

    for (let val of Array.from(this.mappedFieldsValues.values())) {
      // console.log("val");
      // console.log(val);
      if (val === value) {

        isValueUsed = true;
      }
    }

    if (isValueUsed) {

      return true;
    }


    return false;
  }
  loadCustomFields() {
    this.campaignService.getCustomFields()
      .subscribe((res: any) => {

        this.customFields = res.results;
        // console.log(this.customFields);
        // for (let i = 0; i < this.customFields.length; i++) {
        //   this.mappedFields.set(null, null);
        // }



        // console.log(this.mappedFields);



      });
  }

  onChangeObj(even, index) {
    console.log(even);
    // console.log(val);
    console.log(this.mappedFields.keys());

    // this.mappedFields.keys()[index] = even;

    this.mappedFields.set(index, even)
    // this.totalKeys++;
    // this.mappedFields.delete(null)
    //  this.addedKeys = Array.from(this.mappedFields.keys());
    console.log(this.mappedFields);
    console.log(this.mappedFieldsValues);
    

  }

  onChangeObjV(even, index) {


    this.mappedFieldsValues.set(index, even)

    console.log(this.mappedFields);
    console.log(this.mappedFieldsValues);

  }

  changedEditor(event: EditorChangeContent | EditorChangeSelection) {
    console.log('editor got changed', event);
    this.editorText = event['editor']['root']['innerHTML'];
  }

  getTemplateById(index: string) {
    this.service.getCollectionItemById(APIPath.VENDOR_TEMPLATE, index).subscribe((res) => {
      this.emailTemplate = res;
    }, error => {
      console.log(error);
    })
  }
  changeType(type) {
    this.limit = 1;
    this.tags = [];
    console.log(type);
    this.selectedType = type;
    if (this.selectedType === "CANDIDATE") {
      this.emailTemplate.customer_type = "CANDIDATE";
      this.api_path = APIPath.CANDIDATE;
      this.fetchCollectionList();

    } else if (this.selectedType === "CLIENT") {
      this.emailTemplate.customer_type = "CLIENT";
      this.api_path = APIPath.CLIENT;
      this.fetchCollectionList();

    } else if (this.selectedType === "VENDOR") {
      this.emailTemplate.customer_type = "VENDOR";
      this.api_path = APIPath.VENDORS;
      this.fetchCollectionList();

    } else if (this.selectedType === "CUSTOM") {
      this.limit = 100;
      this.emailTemplate.customer_type = "CUSTOM";
      this.api_path = APIPath.CUSTOM_FIELDS;
      this.fetchCollectionList();

    }


  }
  onEdit() {
    this.subscription2$ = this.service.putCollectionItemById
      (APIPath.VENDOR_TEMPLATE, this.indexAsInput, this.emailTemplate).subscribe((res) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();

        this.activeModal.dismiss('Successfully modified template');

      }, error => {
        console.log(error);
      })
  }


  onSubmit() {
    // console.log("**************************")
    // console.log(this.emailTemplate);
    this.subscription1$ = this.service.createCollectionItem(APIPath.VENDOR_TEMPLATE, this.emailTemplate)
      .subscribe((res: any) => {
        console.log(res);
        this.refreshOnModifyOrAdd();
        this.activeModal.dismiss(this.fetchCollectionList());
      }, error => {
        console.log(error);
      });
  }

  refreshOnModifyOrAdd() {
    this.emailTemplate = {} as EmailTemplate;
    this.refreshListEvt.emit(null);
  }

}
