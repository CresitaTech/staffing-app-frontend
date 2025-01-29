import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { DocViewerComponent } from 'src/app/components/doc-viewer/doc-viewer.component';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Filter } from 'src/app/enums/filter.enum';
import { Roles } from 'src/app/enums/role.enum';
import { OfferLetter } from 'src/app/models/offer-letter';
import { AlertService } from 'src/app/services/alert/alert.service';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CustomValidatorService } from 'src/app/services/common/custom-validator.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

@Component({
  selector: 'app-offer-letter',
  templateUrl: './offer-letter.component.html',
  styleUrls: ['./offer-letter.component.scss']
})
export class OfferLetterComponent extends CustomFilterModel<OfferLetter> implements OnInit  {

  api_path = APIPath.OFFER_LETTER_REQUEST;

  @ViewChild(FilterComponent) filter: FilterComponent;
  constants = Constants;
  filterQueryString: string = '';
  eventId: string;
  indexAsInput;
  tagName;
  candidatesArray: any = { '': '' };
  candidatesNameArray: any = [];
  offerLetterRequestList: any = [];
  mailAddress: string;
  //offerLetterRequest: OfferLetter
  offerLetterRequest = { ecms_id: '' } as OfferLetter;
  role = Roles;
  presentRole;
  refreshListEvt = new EventEmitter<any>();
  routerURL: string;
  @Input() page: number;


  //Slider Variables
  mobNumberPattern = "^((\\+91-?)|0)?[0-9]{10}$";
  @ViewChild('closebutton') closebutton;
  private file: any;
  @Output() closeAddEditPage = new EventEmitter<any>();
  formData = new FormData();
  @Input() action;
  fileName
  resumeName;
  @ViewChild("inp") inp: HTMLInputElement
  date = moment(new Date()).format('YYYY-MM-DD');


  constructor(
    public _api: APIProviderService<OfferLetter>,
    _selectAll: SelectAllService,
    public activeModal: NgbActiveModal,
    private ngbCalendar: NgbCalendar,
    private dateAdapter: NgbDateAdapter<string>,
    public customValidator: CustomValidatorService,
    private router: Router,
    private modalService: NgbModal,
    public auth: AuthService,
  ) {

    super(_api, _selectAll);
    this.filterOn.push({ model: 'candidate_name' },
      { model: 'skills' },
      { model: 'job_description' },
      { model: 'current_location' },
      { model: 'client_name' },
      { model: 'qualification' },
      { model: 'visa' });

  }


  ngOnInit(): void {
    this.offerLetterRequest.date_of_birth = this.date;
    this.offerLetterRequest.expected_start_date = this.date;
    this.offerLetterRequest.tentative_joining_date = this.date;
    this.offerLetterRequest.joining_date = this.date;
    this.getOfferLetters()
  }

  ngOnDestroy(): void {
    this.unsubscribeDeleteSub();
    if (this.fetchSub) this.fetchSub.unsubscribe();
  }

  openFilter(): void {
    this.filter.toggle();
  }

  removeFilter(event: string): void {
    this.displayFilter.splice(this.displayFilter.findIndex((el: string) => el === event), 1);
    delete this.filter.filters[event];
    this.filter.sendFilterEvt();
  }

  getOfferLetters() {
    this._api.getListAPI(this.api_path).subscribe(res => {
      console.log(res)
      this.collection = res.results
      console.log(this.collection)
    })
  }

  // Side Add Candidate
  openOfferLetter(event: string, index: number) {
    console.log(event)
    console.log(index)

    this.formClose = false;
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
      this.offerLetterRequest = this.collection[index]
    }
    this.openSidePane("addOfferLetter", 800);
  }

  closeOfferLetter() {
    this.closeSidePane("addOfferLetter");
    this.refreshOnModifyOrAdd();
  }

  /**
   * on save / on edit, closes side panel and reloads page
   */
  refreshPage() {
    this.indexAsInput = undefined;
    this.closeOfferLetter();
    if (this.routerURL === "offer-letter") {
      this.router.navigate(["/home/candidates" + this.api_path]);
    }
    this.fetchCollectionList();

  }

  //select handler to handle- delete, export or Send Mail Actions.
  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    //alert(value);
    if (actionValue === "delete") {
      this.deleteSelectedCollectionItem();
    }
  }

  getResumeUrl(resume: string) {
    //console.log(this.ip+resume);
    return this.ip + resume;
  }

  openResumePopUp(resume: string, index, email) {
    const modalOptions: NgbModalOptions = {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg',
      //windowClass: 'modal-xl'
    }
    const modalRef = this.modalService.open(DocViewerComponent, modalOptions);
    modalRef.componentInstance.url = this.getResumeUrl(resume);
    modalRef.componentInstance.actionToBePerformed.subscribe(($e) => {
      if ($e !== Constants.EMAIL)
        this.doAction($e, index);
      // console.log(email);
    }, error => {
      console.log(error);
    })
  }

  doAction(evt: string, index) {
    console.log("action called");
    const options: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' };
    switch (evt) {
      case this.constants.DELETE: {
        var modalRef = this.modalService.open(DeleteComponent, { backdrop: 'static', centered: true, keyboard: false });
        break;
      }
    }
    if (evt === this.constants.DELETE) {
      modalRef.componentInstance.id = index;
      modalRef.componentInstance.title = Constants.OFFER_LETTER_REQUEST;
      this.collection.forEach(item => {
        if (item.id === index) { modalRef.componentInstance.name = item.candidate_name; }
      })
      modalRef.result.then(res => {
        if (res.result) {
          this.deleteCollectionItem(res.id);
        }
      });
    }

    else {
      this.offerLetterRequest = this.collection[index];
      modalRef.componentInstance.eventId = Constants.EDIT;
      modalRef.componentInstance.candidate_name = this.offerLetterRequest.candidate_name;
      modalRef.componentInstance.email = this.collection[index].email;
      modalRef.componentInstance.resume = this.collection[index].resume;
      modalRef.componentInstance.isPopup = true;
      modalRef.result.then(res => {
        this.fetchCollectionList();
      }, error => {
        console.log(error);
      }
      );
    }

  }

  myOfferLetter() {
    this.router.navigate(['/home/candidates/offer-letter']);
  }


  // Slider Component
  onEdit() {
    this.appendResumeToOfferLetter();
    // this.formData.get('resume')
    // this.formData.get('candidate_information_sheet')
    if (this.formData.has('offer_letter_pdf'))
      this.formData.delete('offer_letter_pdf')
    if (this.formData.get('resume') === '--' || this.formData.get('resume') === typeof (String)) {
      this.formData.delete('resume');
    }
    if (this.formData.get('candidate_information_sheet') === '--' || this.formData.get('resume') === typeof (String)) {
      this.formData.delete('candidate_information_sheet');
    }
    this._api.putCollectionItemById
      (APIPath.OFFER_LETTER_REQUEST, this.indexAsInput, this.formData).subscribe((res) => {
        this.refreshOnModifyOrAdd();
      })
    // this.refreshOnModifyOrAdd();
  }

  readFile(event, keyName: string) {
    console.log(keyName)
    console.log((<HTMLInputElement>event.target).files[0])
    this.file = (<HTMLInputElement>event.target).files[0];
    //this.offerLetterRequest[keyName] = this.file;
    this.formData.append(keyName, this.file);
  }

  appendResumeToOfferLetter() {
    const keys = Object.keys(this.offerLetterRequest);
    console.log(keys)
    // this.formData = new FormData();
    keys.forEach(k => {
      if (this.offerLetterRequest[k] && k !== 'resume' && k !== 'candidate_information_sheet') {
        if (k !== 'offer_letter_pdf' && !this.formData.has(k)) {
          this.formData.append(k, this.offerLetterRequest[k]);
        }
        if (this.formData.get(k) === 'undefined' || this.formData.get(k) === null)
          this.formData.delete(k)
      }
    })

  }


  onSubmit() {
    this.appendResumeToOfferLetter();
    //console.log(this.offerLetterRequest)
    // this.formData.append('candidate_name', this.offerLetterRequest.candidate_name)
    // this.formData.append('years_of_exp', this.offerLetterRequest.years_of_exp)
    // this.formData.append('skill_set', this.offerLetterRequest.skill_set)
    // this.formData.append('contact_no', this.offerLetterRequest.contact_no)
    // this.formData.append('email', this.offerLetterRequest.email)
    // this.formData.append('date_of_birth', this.offerLetterRequest.date_of_birth)
    // this.formData.append('degree', this.offerLetterRequest.degree)
    // this.formData.append('percentage', this.offerLetterRequest.percentage)
    // this.formData.append('university_name', this.offerLetterRequest.university_name)
    // this.formData.append('pan_no', this.offerLetterRequest.pan_no)
    // this.formData.append('qualification_completion', this.offerLetterRequest.qualification_completion)
    // this.formData.append('current_location', this.offerLetterRequest.current_location)
    // this.formData.append('tentative_joining_date', this.offerLetterRequest.tentative_joining_date)
    // this.formData.append('client_name', this.offerLetterRequest.client_name)
    // this.formData.append('client_location', this.offerLetterRequest.client_location)
    // this.formData.append('ecms_id', this.offerLetterRequest.ecms_id)
    // this.formData.append('candidate_ctc', this.offerLetterRequest.candidate_ctc)
    // this.formData.append('client_rate', this.offerLetterRequest.client_rate)
    // this.formData.append('joining_date', this.offerLetterRequest.joining_date)
    // this.formData.append('contract_duration', this.offerLetterRequest.contract_duration)
    // this.formData.append('expected_start_date', this.offerLetterRequest.expected_start_date)
    // this.formData.append('bgc_steps', this.offerLetterRequest.bgc_steps)
    // this.formData.append('expected_working_hours', this.offerLetterRequest.expected_working_hours)
    // this.formData.append('laptop_provided', this.offerLetterRequest.laptop_provided)
    // this.formData.append('provident_fund', this.offerLetterRequest.provident_fund)

    this._api.createCollectionItem(APIPath.OFFER_LETTER_REQUEST, this.formData)
      .subscribe((res: any) => {
        console.log(res)
        //this.refreshOnModifyOrAdd();
      });
    this.refreshOnModifyOrAdd();
    this.closeOfferLetter();
    this.myOfferLetter()
  }

  refreshOnModifyOrAdd() {
    this.formData = new FormData();
    this.offerLetterRequest = {} as OfferLetter;
    this.clearOfferLetterRequestFields();
    this.refreshListEvt.emit(null);

  }

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }

  phoneNumberRef(event, element: HTMLInputElement, form: NgForm) {
    this.customValidator.phoneNumberFormat(event, element, form);
  }

  preventEnter(event, formController) {
    this.customValidator.preventEnter(event, formController);
  }

  closeClient() {
    this.closeAddEditPage.emit(null);
  }
  clearOfferLetterRequestFields() {
    this.offerLetterRequest.candidate_name = null;
    this.offerLetterRequest.years_of_exp = null;
    this.offerLetterRequest.skill_set = null;
    this.offerLetterRequest.contact_no = null;
    this.offerLetterRequest.email = null;
    this.offerLetterRequest.date_of_birth = this.date;
    this.offerLetterRequest.degree = null;
    this.offerLetterRequest.percentage = null;
    this.offerLetterRequest.university_name = null;
    this.offerLetterRequest.pan_no = null;
    this.offerLetterRequest.qualification_completion = null;
    this.offerLetterRequest.current_location = null;
    this.offerLetterRequest.tentative_joining_date = null;
    this.offerLetterRequest.client_name = null;
    this.offerLetterRequest.client_location = null;
    this.offerLetterRequest.ecms_id = null;
    this.offerLetterRequest.candidate_ctc = null;
    this.offerLetterRequest.client_rate = null;
    this.offerLetterRequest.joining_date = this.date;
    this.offerLetterRequest.contract_duration = null;
    this.offerLetterRequest.expected_start_date = this.date;
    this.offerLetterRequest.bgc_steps = null;
    this.offerLetterRequest.expected_working_hours = null;
    this.offerLetterRequest.laptop_provided = null;
    this.offerLetterRequest.resume = null;
    this.offerLetterRequest.provident_fund = null;
  }

  deleteOfferLetterRequest(id: string) {
    this._api.deleteCollectionItemById(APIPath.OFFER_LETTER_REQUEST, id).subscribe((res) => {
    })
  }

}
