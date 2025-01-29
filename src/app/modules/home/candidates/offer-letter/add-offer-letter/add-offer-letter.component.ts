import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
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
import { JobDescriptions } from 'src/app/models/candidate';
import { OfferLetter } from 'src/app/models/offer-letter';
import { AlertService } from 'src/app/services/alert/alert.service';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CustomValidatorService } from 'src/app/services/common/custom-validator.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

@Component({
  selector: 'app-add-offer-letter',
  templateUrl: './add-offer-letter.component.html',
  styleUrls: ['./add-offer-letter.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class AddOfferLetterComponent extends CustomFilterModel<OfferLetter> implements OnInit  {

  api_path = APIPath.OFFER_LETTER_REQUEST;

  @ViewChild(FilterComponent) filter: FilterComponent;
  constants = Constants;
  filterQueryString: string = '';
  @Input() eventId: string;
  @Input() indexAsInput: string
  @Input() candidate_name;
  @Input() candidate_id: string;
  tagName;
  candidatesArray: any = { '': '' };
  candidatesNameArray: any = [];
  offerLetterRequestList: any = [];
  mailAddress: string;
  //offerLetterRequest: OfferLetter
  offerLetterRequest = {} as OfferLetter;
  role = Roles;
  presentRole;
  refreshListEvt = new EventEmitter<any>();
  routerURL: string;
  @Input() page: number;


  //Slider Variables
  mobNumberPattern = "^((\\+91-?)|0)?[0-9]{10}$";
  @ViewChild('closebutton') closebutton;
  @ViewChild("f1") form: NgForm;

  private file: any;
  @Output() closeAddEditPage = new EventEmitter<any>();
  formData = new FormData();
  @Input() action;
  fileName
  resumeName;
  @ViewChild("inp") inp: HTMLInputElement
  date = moment(new Date()).format('YYYY-MM-DD');
  job_descriptions: Array<JobDescriptions | any> = [];


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
    private changeref: ChangeDetectorRef

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
    console.log("Current date: " + this.date)
    this.offerLetterRequest.date_of_birth = this.date;
    this.offerLetterRequest.expected_start_date = this.date;
    this.offerLetterRequest.tentative_joining_date = this.date;
    this.offerLetterRequest.joining_date = this.date;
    this.offerLetterRequest.resume = null;
    //this.getOfferLetters()
    console.log('add this.eventId: ' + this.indexAsInput)

    if (this.indexAsInput != undefined)
      this.getActivityById(this.indexAsInput);

  }

  
  ngAfterContentChecked() {
    this.changeref.detectChanges();
  }

  
  detailsOfSelectedCandidate(evt) {
    // console.log(evt.stage.id)
    // this.activity.activity_status = evt.stage;
    this.getActivityById(evt);
    console.log('-----------------------------Add offer Letter' + this.candidate_name);
    console.log('-----------------------------Add offer Letter' + this.candidate_id);

  }

  public changeFormToDirty(event): void {
    
    console.log('event: ' + event)
    this.getActivityById(event);
    this.form.form.markAsDirty();
  }

  getActivityById(index: string) {
    console.log('Offer Letter Data fetching: ' + index)
    this._api.getCollectionItemByCandidateId(APIPath.GET_CANDIDATE_JOB_STAGES, index).subscribe((res: any) => {
      console.log(res)
      res.forEach(_ => {
        this.offerLetterRequest.years_of_exp = _.candidate_name.total_experience;
        this.offerLetterRequest.skill_set = _.candidate_name.skills_1;
        this.offerLetterRequest.contact_no = _.candidate_name.primary_phone_number;
        this.offerLetterRequest.email = _.candidate_name.primary_email;
        this.offerLetterRequest.date_of_birth = _.candidate_name.date_of_birth;
        this.offerLetterRequest.degree = _.candidate_name.qualification;
        //this.offerLetterRequest.percentage = _.candidate_name.total_experience;
        //this.offerLetterRequest.university_name = _.candidate_name.total_experience;
        //this.offerLetterRequest.pan_no = _.candidate_name.total_experience;
        this.offerLetterRequest.qualification_completion = _.candidate_name.additional_qualification;
        this.offerLetterRequest.current_location = _.candidate_name.current_location;
        //this.offerLetterRequest.tentative_joining_date = _.candidate_name.total_experience;
        this.offerLetterRequest.client_name = _.candidate_name.employer_name;
        //this.offerLetterRequest.client_location = _.candidate_name.max_salary;
        this.offerLetterRequest.candidate_ctc = _.candidate_name.max_salary;
        this.offerLetterRequest.client_rate = _.candidate_name.max_rate;
        //this.offerLetterRequest.joining_date = _.candidate_name.total_experience;
        //this.offerLetterRequest.contract_duration = _.candidate_name.total_experience;
        //this.offerLetterRequest.expected_start_date = _.candidate_name.total_experience;
        //this.offerLetterRequest.expected_working_hours = _.candidate_name.total_experience;
        this.offerLetterRequest.resume = _.candidate_name.resume;

        console.log(this.offerLetterRequest)

      })
    }, error => {

      console.log("Error 1 : " + error);

    })
  }

  getCandidateDetails($event): void{
    console.log("$event: " + $event)
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
    //this.formData.append('date_of_birth', moment(this.offerLetterRequest.date_of_birth).format('YYYY-MM-DD'))
    // this.formData.append('degree', this.offerLetterRequest.degree)
    // this.formData.append('percentage', this.offerLetterRequest.percentage)
    // this.formData.append('university_name', this.offerLetterRequest.university_name)
    // this.formData.append('pan_no', this.offerLetterRequest.pan_no)
    // this.formData.append('qualification_completion', this.offerLetterRequest.qualification_completion)
    // this.formData.append('current_location', this.offerLetterRequest.current_location)
    //this.formData.append('tentative_joining_date', moment(this.offerLetterRequest.tentative_joining_date).format('YYYY-MM-DD'))
    // this.formData.append('client_name', this.offerLetterRequest.client_name)
    // this.formData.append('client_location', this.offerLetterRequest.client_location)
    // this.formData.append('ecms_id', this.offerLetterRequest.ecms_id)
    // this.formData.append('candidate_ctc', this.offerLetterRequest.candidate_ctc)
    // this.formData.append('client_rate', this.offerLetterRequest.client_rate)
    //this.formData.append('joining_date', moment(this.offerLetterRequest.joining_date).format('YYYY-MM-DD'))
    // this.formData.append('contract_duration', this.offerLetterRequest.contract_duration)
    //this.formData.append('expected_start_date', moment(this.offerLetterRequest.expected_start_date).format('YYYY-MM-DD'))
    // this.formData.append('bgc_steps', this.offerLetterRequest.bgc_steps)
    // this.formData.append('expected_working_hours', this.offerLetterRequest.expected_working_hours)
    // this.formData.append('laptop_provided', this.offerLetterRequest.laptop_provided)
    // this.formData.append('provident_fund', this.offerLetterRequest.provident_fund)

    console.log("==================form data ============")
    this.formData.append('expected_start_date' , moment(this.offerLetterRequest.expected_start_date).format('YYYY-MM-DD'))
    console.log(this.formData)
    console.log(this.offerLetterRequest)
    this._api.createCollectionItem(APIPath.OFFER_LETTER_REQUEST, this.formData)
      .subscribe((res: any) => {
        console.log(res)
        //this.refreshOnModifyOrAdd();
      });
    this.refreshOnModifyOrAdd();
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
