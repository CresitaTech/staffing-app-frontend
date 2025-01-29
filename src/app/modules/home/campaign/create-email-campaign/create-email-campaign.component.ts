import { DatePipe } from '@angular/common';
import { Component, OnInit, Output, Input, EventEmitter, ViewChild, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal, ModalDismissReasons, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { forkJoin, Subscription } from 'rxjs';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Activity } from 'src/app/models/activity';
import { Candidate, JobDescriptions } from 'src/app/models/candidate';
import { AlertService } from 'src/app/services/alert/alert.service';
import { Paging } from 'src/app/classes/paging';
import { vendor } from 'src/app/models/vendor';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { ClientImportComponent } from 'src/app/modules/home/clients/client-import/client-import.component';
import { NavigationExtras, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { NgbModalStack } from '@ng-bootstrap/ng-bootstrap/modal/modal-stack';
import { NgbModalWindow } from '@ng-bootstrap/ng-bootstrap/modal/modal-window';
import { Mail } from 'src/app/models/mail';
import { EmailList } from 'src/app/models/email-list';
import { RouteReuseStrategy } from '@angular/router'
import { CustomFilterInterface } from 'src/app/models/filters';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Filter } from 'src/app/enums/filter.enum';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { CampaignService } from 'src/app/services/campaign/campaign.service';
declare const $: any;
@Component({
  selector: 'app-create-email-campaign',
  templateUrl: './create-email-campaign.component.html',
  styleUrls: ['./create-email-campaign.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class CreateEmailCampaignComponent extends CustomFilterModel<vendor> implements OnInit, OnChanges {
  @Input() campaignListId?: String;
  @Input() campaignListName?: String;
  @Input() campaignListSize?: any;
  @Input() isCreateList?: boolean = true;
  @Output() refreshListEvt = new EventEmitter<any>();
  // @Input() indexAsInput: string;
  // @Input() eventId: string;
  // @Input() candidate_name;
  // @Input() candidate_id: string;
  // @Input() job_description;
  // @Input() stage: any;
  api_path = APIPath.CANDIDATE;
  @ViewChild(FilterComponent) filter: FilterComponent;
  filterQueryString: string = '';
  activity = { notes: '' } as Activity;
  constants = Constants;
  selectedType?= null;
  filterPath: string;

  subscription1$: Subscription;
  subscription2$: Subscription;
  reviewStatusData = true;
  statusFormDisplay = false
  selectSalaryRateFlag = false
  currencyTag: string;
  files: any[] = [];
  emailIdArray: any;
  eventId: any;
  file: any;
  csvFields: Array<any> = [];
  customFields: Array<any> = [];
  fileToSend;
  sheetObject: any;
  fileName: string;
  formData = new FormData();
  isResumeUpdate = false
  currentDialog = "customerSelect";
  dataType: String;
  emailList = {} as EmailList;
  tagName = Constants.VENDOR_LIST;
  candidate = { remarks: '' } as Candidate;
  isFileUloaded = false;



  @ViewChild("closebutton") closebutton;
  @ViewChild("f") form: NgForm;

  action: string = "add";
  job_descriptions: Array<JobDescriptions | any> = [];
  date = moment(new Date()).format('YYYY-MM-DD');
  datePipe: DatePipe = new DatePipe('en-US');
  mappedFields: Map<any, any> = new Map<any, any>();

  constructor(
    private emailService: APIProviderService<EmailList>,
    service: APIProviderService<vendor>,
    private router: Router,
    selectAllService: SelectAllService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private campaignService: CampaignService
  ) {
    super(service, selectAllService);
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.filterOn.push({ model: 'specialised_in' },
      { model: 'contact_person_first_name' },
      { model: 'contact_person_last_name' },
      { model: 'company_name' });
  }



  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };

  ngOnInit(): void {
    if (this.campaignListId && this.campaignListName) {
      this.currentDialog = "resend";
      this.dataType = "Rechurn";

    } else if (!this.isCreateList) {
      this.currentDialog = 'submit';
    } if (this.isCreateList) {
      this.loadCustomFields();

    }
  }

  valueInMap(key, value) {
    const values = [...this.mappedFields.values()];
    // console.log(values);
    var isValueUsed = false;

    this.csvFields.forEach((item, index) => {
      console.log(item);
      if (this.mappedFields[item] === value) {
        isValueUsed = true;
      }
    });

    if (isValueUsed) {
      console.log('✅ value is contained in the Map');

      return true;
    }

    console.log('⛔️ value is not contained in the Map');
    return false;
  }

  loadCustomFields() {
    this.campaignService.getCustomFields()
      .subscribe((res: any) => {

        this.customFields = res.results;
        console.log(this.customFields);
      });
  }

  ngOnChanges(): void {
    console.log(this.mappedFields);
  }
  openFilter(): void {
    this.filter.toggle();
  }

  onFieldSelect(csvField: string, value: string) {
    console.log("the selected value is " + value);
    // this.mappedFields[csvField] = value;
    console.log(this.mappedFields);

    this.customFields.forEach((item, index) => {
      if (item.id === value) this.customFields.splice(index, 1);
    });

  }

  onFileSelected(event) {
    console.log(event);
    const file: File = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.fileName = file.name;
      this.fileToSend = file;
      this.arrayBuffer = reader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      var first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[first_sheet_name];
      this.sheetObject = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      console.log("this.sheetObject start");
      console.log(this.sheetObject);

      if (this.sheetObject && this.sheetObject.length > 0) {
        this.isFileUloaded = true;
        this.csvFields = Object.keys(this.sheetObject[0]);
        this.csvFields.forEach(element => {
          this.mappedFields[element] = null;
        });

      }
      console.log(this.csvFields);
      console.log("this.sheetObject end");
      // var range = XLSX.utils.decode_range(worksheet[first_sheet_name]);
      this.emailList.list_size = this.sheetObject.length;
      if (this.emailList.list_size && this.emailList.list_size > 0) {
        this.emailList.list_size = this.emailList.list_size - 1;
      }
    }
    reader.readAsArrayBuffer(file);
  }


  removeFilter(event: string): void {
    this.displayFilter.splice(this.displayFilter.findIndex((el: string) => el === event), 1);
    delete this.filter.filters[event];
    this.filter.sendFilterEvt();
  }



  changeType(type) {
    console.log(type);
    this.selectedType = type;
    console.log(this.selectedType);
    this.filterOn = [];
    if (this.selectedType === "CANDIDATE") {
      this.dataType = 'Candidate'
      this.filterOn.push({
        model: 'rate',
        type: Filter.RANGE2,
        range: { start: 0, end: 10, param: 'in $' }
      }, {
        model: 'salary',
        type: Filter.RANGE2,
        range: { start: 0, end: 10, param: 'in $' }
      }, {
        model: 'total_experience',
        type: Filter.RANGE,
        range: { start: 0, end: 10, param: 'in Years' }
      }, {
        model: 'total_experience_in_usa',
        type: Filter.RANGE,
        range: { start: 0, end: 10, param: 'in Years' }
      }, { model: 'skills_1' },
        { model: 'skills_2' },
        { model: 'job_description' },
        { model: 'current_location' },
        { model: 'first_name' },
        { model: 'designation' },
        {
          model: 'stage',
          type: Filter.STATUS,
        },
        { model: 'client_name' },
        { model: 'qualification' },
        { model: 'country', type: Filter.PICKER, },
        { model: 'visa' });
      this.api_path = APIPath.CANDIDATE;

    } else if (this.selectedType === "CLIENT") {
      this.dataType = 'Client'
      this.filterOn.push({
        model: 'total_employee',
        type: Filter.RANGE,
        range: { start: 0, end: 10, param: 'Count' }
      },
        { model: 'first_name' },
        { model: 'last_name' },
        { model: 'primary_skills' },
        { model: 'secondary_skills' },
        { model: 'company_name' });
      this.api_path = APIPath.CLIENT;

    } else if (this.selectedType === "VENDOR") {
      this.dataType = 'Vendor'
      this.filterOn.push({ model: 'specialised_in' },
        { model: 'contact_person_first_name' },
        { model: 'contact_person_last_name' },
        { model: 'company_name' });
      this.api_path = APIPath.VENDORS;

    }
    if (this.selectedType !== "null") {
      this.fetchCollectionList();
      this.currentDialog = 'list';
    } else if (this.selectedType === "null") {
      this.currentDialog = 'customerSelect';
    }
    console.log(this.currentDialog);
  }

  openImportModal() {
    const modalRef = this.modalService.open(ClientImportComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.result.then(res => {
      alert("got it");
    });
  }
  arrayBuffer: any;

  onFileDropped(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileName = file.name;
        this.fileToSend = file;
        this.arrayBuffer = reader.result;
        var data = new Uint8Array(this.arrayBuffer);
        var arr = new Array();
        for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
        var bstr = arr.join("");
        var workbook = XLSX.read(bstr, { type: "binary" });
        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];
        this.sheetObject = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        if (this.sheetObject && this.sheetObject.length > 0) {
          this.isFileUloaded = true;
          this.csvFields = Object.keys(this.sheetObject[0]);
          this.csvFields.forEach(element => {
            this.mappedFields[element] = null;
          });

        }
        // var range = XLSX.utils.decode_range(worksheet[first_sheet_name]);
        this.emailList.list_size = this.sheetObject.length;
        if (this.emailList.list_size && this.emailList.list_size > 0) {
          this.emailList.list_size = this.emailList.list_size - 1;
        }
      }
      reader.readAsArrayBuffer(file);
    }


  }


  readHeadersAndDisplay() {
    var extras: NavigationExtras =
    {
      state:
      {
        fieldsToMap: JSON.stringify(this.sheetObject),
        fileName: this.fileName,
        file: this.fileToSend
      }
    }

  }
  onSubmit() {
    this.formData = new FormData();
    // this.formData.append('list_description', this.emailList.list_description);



    if (!this.isCreateList) {

      // this.formData.append('list_size', this.emailList.list_size.toString());
      this.formData.append("list_name", this.emailList.list_name);
      this.formData.append('campaign_name', this.emailList.campaign_name);
      this.formData.append("template_name", this.emailList.template_name);
      this.formData.append('campaign_description', this.emailList.list_description);
    } else if (this.isCreateList) {

      this.formData.append('list_size', this.emailIdArray.length);
      this.formData.append('list_data', this.emailIdArray);
      this.formData.append('list_name', this.emailList.list_name);
      this.formData.append('data_type', this.dataType.toString());
      this.formData.append('list_description', this.emailList.list_description);
    } else if (this.campaignListId) {

      this.formData.append('list_size', this.campaignListSize);
      this.formData.append("list_id", this.campaignListId!.toString());
    }
    console.log(this.formData.get('list_data'))

    this.emailService.createCollectionItem(this.isCreateList ? APIPath.CAMPAIGN_LIST : APIPath.CAMPAIGN, this.formData)
      .subscribe((res: any) => {
        this.emailList = {} as EmailList;
        this.formData = {} as FormData;
        console.log(this.formData)
        console.log(this.emailList)
        this.refreshListEvt.emit(null);
        this.closebutton.nativeElement.click();
        this.router.navigate(this.isCreateList ? ['/home/campaign/email-list'] : ['/home/campaign/campaigns']);
      });
  }
  readUrl(data) {
    console.log(data);
  }

  onSubmitUploadData() {
    this.formData = new FormData();

    const obj = JSON.stringify(this.mappedFields);
    // console.log(obj);
    this.formData.append('list_description', this.emailList.list_description);
    this.formData.append('list_name', this.emailList.list_name);
    this.formData.append('list_mapping', obj);
    this.formData.append('list_size', this.emailList.list_size.toString());
    this.formData.append('upload_file', this.fileToSend);
    if (!this.isCreateList) {
      this.formData.append("template_name", this.emailList.template_name);
    }
    this.formData.append("created_by", "");
    this.formData.append("updated_by", "");
    this.formData.append('data_type', this.dataType.toString());

    this.emailService.createCollectionItem(APIPath.CAMPAIGN_LIST, this.formData)
      .subscribe((res: any) => {
        this.emailList = {} as EmailList;
        this.formData = {} as FormData;
        console.log(this.formData)
        console.log(this.emailList)
        this.refreshListEvt.emit(null);
        this.closebutton.nativeElement.click();
        this.router.navigate(this.isCreateList ? ['/home/campaign/email-list'] : ['/home/campaign/campaigns']);
      });
  }


  showSubmitScreen() {
    var emailId = '';
    this.emailIdArray = [];
    this.collectionMapForSelectFlag.forEach((value, key) => {
      if (value === true) {
        if (this.collectionMapForId.has(key)) {
          emailId = this.collectionMapForId.get(key);
          this.emailIdArray.push(emailId);
        }
        //console.log(this.vendorIdArray)
      }
    }
    )

    if (this.emailIdArray.length > 0) {
      this.currentDialog = 'submit';
      this.emailList.list_data = this.emailIdArray;
      this.emailList.list_size = this.emailIdArray.length;
      this.emailList.list_description = '';
      this.emailList.template_name = null;
    }

  }


  checkNextCondition() {
    if (this.currentDialog === 'list') {
      this.showSubmitScreen()
    } else if (this.currentDialog === 'submit' || this.currentDialog === 'resend') {
      this.onSubmit();
    } else if (this.currentDialog === 'upload') {
      this.onSubmitUploadData();
    }
  }

  checkPreviousCondition() {
    if (this.currentDialog === 'submit') {
      this.emailList = {} as EmailList;
      this.formData = {} as FormData;
      this.currentDialog = 'list';
    }
    if (this.currentDialog === 'upload') {
      this.emailList = {} as EmailList;
      this.formData = {} as FormData;
      this.currentDialog = 'customerSelect';
    }
  }

}
