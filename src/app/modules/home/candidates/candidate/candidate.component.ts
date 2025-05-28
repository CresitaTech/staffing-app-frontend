import { Component, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from './../../../../enums/constants.enum';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { AddRepositoryComponent } from '../../candidate-repository/add-repository/add-repository.component';
import { CandidateImportComponent } from './candidate-import/candidate-import.component';
import { AddCardComponent } from '../placement-card/add-card/add-card.component';
import { AddRtrComponent } from '../rtr/add-rtr/add-rtr.component';
import { AddActivityComponent } from './../activity/add-activity/add-activity.component';
import { CustomFilterInterface } from 'src/app/models/filters';
import { Candidate } from '../../../../models/candidate'
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Filter } from 'src/app/enums/filter.enum';
import { DocViewerComponent } from 'src/app/components/doc-viewer/doc-viewer.component';
import { SendMailComponent } from './send-mail/send-mail.component';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Roles } from 'src/app/enums/role.enum';
import { StatusUpdateComponent } from './status-update/status-update.component';
import { SubmissionDetailsComponent } from './submission-details/submission-details.component';
import { AddOfferLetterComponent } from '../offer-letter/add-offer-letter/add-offer-letter.component';
import { CandidateMatchForJobComponent } from './candidate-match-for-job/candidate-match-for-job.component';
import { AddActivityInternalComponent } from '../activity/add-activity-internal/add-activity-internal.component';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' }

@Component({
  selector: 'app-candidate',
  templateUrl: './candidate.component.html',
  styleUrls: ['./candidate.component.scss']
})


export class CandidateComponent
  extends CustomFilterModel<Candidate>
  implements OnInit, OnDestroy, CustomFilterInterface {

  /**
   * Required field
   */
  api_path = APIPath.CANDIDATE;

  @ViewChild(FilterComponent) filter: FilterComponent;
  isChecked: boolean = false;
  constants = Constants;
  filterQueryString: string = '';
  eventId: string;
  indexAsInput;
  tagName;
  candidatesArray: any = { '': '' };
  candidatesNameArray: any = [];
  candidatesIdArray: any = [];
  mailAddress: string;
  filterPath:string;
  role = Roles;
  presentRole;
  refreshListEvt = new EventEmitter<any>();
  isDeleteDisabled: boolean;

  constructor(
    _api: APIProviderService<Candidate>,
    _selectAll: SelectAllService,
    private router: Router,
    private modalService: NgbModal,
    public auth: AuthService,
  ) {

    super(_api, _selectAll);
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
      { model: 'stage' ,
      type: Filter.STATUS,},
      { model: 'client_name' },
      { model: 'qualification' },
      { model: 'country', type: Filter.PICKER, },
      { model: 'visa' });

  }


  ngOnInit(): void {
    const storedChecked = localStorage.getItem('isChecked');
    this.isChecked = storedChecked ? JSON.parse(storedChecked) : false;
    if (this.isChecked) {
      this.routerURL = "my-candidates";
      this.mycandidateCheck = true;
    } else {
      this.routerURL = '';
      this.mycandidateCheck = false;
    }
    // this.routerURL = this.router.url.split("/")[4];
    if (this.routerURL === "my-candidates") {
      console.log(this.routerURL)
      var url = this.api_path + "?action=my-candidates";
      this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit}&offset=${this.offSet()}&search=&ordering=-created_at`);
    }
    else
      this.fetchCollectionList();
    this.getRole();

    console.log('list oninit: ' + this.eventId)
    if(this.presentRole === this.role.RECRUITER){
      this.isDeleteDisabled = true;
    }else{
      this.isDeleteDisabled = false;
    }
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


  // Side Add Candidate
  openCandidate(event: string, index: number) {
    this.formClose = false;
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    this.openSidePane("addCandidate", 800);
  }

  closeCandidate() {
    this.closeSidePane("addCandidate");
  }

  /**
   * on save / on edit, closes side panel and reloads page
   */
  refreshPage() {
    this.indexAsInput = undefined;
    this.closeCandidate();
    if (this.routerURL === "my-candidates") {
      this.router.navigate(["/home" + this.api_path]);
    }
    this.fetchCollectionList();

  }

  refreshEmailPage() {
    this.indexAsInput = undefined;
    this.closeSendMail();
  }



  // Side Send Mail
  openSendMail(mailString) {

    this.tagName = Constants.CANDIDATE;
    // alert(this.mailAddress);
    document.getElementById("sendMail").style.width = "800px";
  }




  closeSendMail() {
    document.getElementById("sendMail").style.width = "0";
  }



  singleMail(email) {
    this.mailAddress = "";
    //console.log("email"+email);
    this.mailAddress = this.mailAddress + email;
    this.openSendMail(this.mailAddress);
  }

  openCandidateStatusUpdate() {
    console.log(this.candidatesIdArray)

    const modalRef = this.modalService.open(StatusUpdateComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'md'
    });
    modalRef.componentInstance.candidatesIdArray = this.candidatesIdArray;
    modalRef.componentInstance.candidatesNameArray = this.candidatesNameArray;
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.result.then(res => {
      this.refreshPage()

      modalRef.componentInstance.refreshListEvt.emit(null);
    }, error => {
      console.log(error);
    });
  }



  //select handler to handle- delete, export or Send Mail Actions.
  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    //alert(value);
    if (actionValue === "delete") {
      this.deleteSelectedCollectionItem();
    }
    else if (actionValue === "candidatesStatus") {
      this.candidatesNameArray = [];
      this.candidatesIdArray = [];
      this.collectionMapForSelectFlag.forEach((value, key) => {
        if (value === true) {
          console.log(this.collectionMapForName)
          if (this.collectionMapForName.has(key))
            if (this.candidatesNameArray.includes(this.collectionMapForName.get(key)) === false)
              this.candidatesNameArray.push(this.collectionMapForName.get(key));
          if (this.candidatesIdArray.includes(key) === false)
            this.candidatesIdArray.push(this.collectionMapForId.get(key))

          // console.log(this.candidatesArray)
          this.openCandidateStatusUpdate()
        }
      }
      )
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
      this.mailAddress = this.mailAddress.substr(0, this.mailAddress.length - 1)
      this.openSendMail(this.mailAddress);
    }
  }

  openImportModal() {
    const modalRef = this.modalService.open(CandidateImportComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.result.then(res => {

    }, error => {
      console.log(error);
    });
  }


  openExport() {
    console.log("Tog: " + this.mycandidateCheck);
    this.exportCandidateItem(APIPath.EXPORT_CANDIDATE, this.mycandidateCheck, this.filterPath);
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
      else {
        const modalRefN = this.modalService.open(SendMailComponent, modalOptions);
        modalRefN.componentInstance.mailAddress = email;
        modalRefN.componentInstance.eventId = Constants.POP_UP;
        modalRefN.componentInstance.tagName = Constants.CANDIDATE;
        modalRefN.result.then(res => {
          this.fetchCollectionList();
        }, error => {
          console.log(error);
        }
        );
      }
      // console.log(email);
    }, error => {
      console.log(error);
    })
    // modalRef.result.then(res => {
    // //  alert("got it");
    // },error=>{
    //   console.log(error);
    // });
  }

  openSubmissionDetails(index) {
    const modalOptions: NgbModalOptions = {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg',
    }
    const modalRef = this.modalService.open(SubmissionDetailsComponent, modalOptions);
    modalRef.componentInstance.index = index;


    modalRef.componentInstance.actionToBePerformed.subscribe(($e) => {
      if ($e !== Constants.EMAIL)
        this.doAction($e, index);
      else {
        //const modalRefN = this.modalService.open(SendMailComponent, modalOptions);
        //  modalRefN.componentInstance.mailAddress = email;
        //  modalRefN.componentInstance.eventId = Constants.POP_UP;
        //  modalRefN.componentInstance.tagName = Constants.CANDIDATE;
      }
    }, error => {
      console.log(error);
    })

  }


  openMatchedJobsOnCandidateModel(c){
    let modalRef = this.modalService.open(CandidateMatchForJobComponent, _NgbModalOptions);
    modalRef.componentInstance.candidate_id = c.id;
  }

  doAction(evt: string, index) {
    console.log("action called");
    const options: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' };
    switch (evt) {
      case this.constants.SUBMITTED_FOR: {
        var modalRef = this.modalService.open(SubmissionDetailsComponent, options)
        break;
      }
      case this.constants.DELETE: {
        if(!this.isDeleteDisabled){
          var modalRef = this.modalService.open(DeleteComponent, { backdrop: 'static', centered: true, keyboard: false });
        }
        break;
      }
      case this.constants.RTR: {
        var modalRef = this.modalService.open(AddRtrComponent, options);
        break;
      }
      case this.constants.CARD: {
        var modalRef = this.modalService.open(AddCardComponent, options);
        break;
      }
      case this.constants.ACTIVITY: {
        var modalRef = this.modalService.open(AddActivityComponent, options);
        break;
      }
      case this.constants.ACTIVITY_INTERNAL: {
        var modalRef = this.modalService.open(AddActivityInternalComponent, options);
        break;
      }
      case this.constants.REPOSITORY: {
        var modalRef = this.modalService.open(AddRepositoryComponent, options);
        break;
      }
      case this.constants.OFFER_LETTER_REQUEST: {
        var modalRef = this.modalService.open(AddOfferLetterComponent, options);
        break;
      }

    }

      if (evt === this.constants.DELETE) {
        modalRef.componentInstance.id = index;
        modalRef.componentInstance.title = Constants.CANDIDATE;
        this.collection.forEach(item => {
          if (item.id === index) { modalRef.componentInstance.name = item.first_name ?? "" + item.last_name ?? ""; }
        })

        modalRef.result.then(res => {
          if (res.result) {
            this.deleteCollectionItem(res.id);
          }
        });


      }

      else {
        const candidate_id = this.collection[index].id;
        const candidate_name = this.collection[index].first_name;
        const candidate_full_name = this.collection[index].first_name + " " + this.collection[index].last_name
        //console.log("candidate params");
        //console.log(this.collection[index]);
        modalRef.componentInstance.eventId = Constants.POP_UP;
        if (evt === this.constants.SUBMITTED_FOR) {
          modalRef.componentInstance.candidate_name = candidate_full_name;
        }
        else {
          modalRef.componentInstance.candidate_name = candidate_name;
        }
        modalRef.componentInstance.primary_email = this.collection[index].primary_email;
        modalRef.componentInstance.primary_phone = this.collection[index].primary_phone_number;

        /*
         Handled- Max Rate , min rate , max salary and min salary conditions
        */
        if (this.collection[index].min_rate !== null && this.collection[index].max_rate !== null)
          modalRef.componentInstance.rate = this.collection[index].min_rate + "-" + this.collection[index].max_rate;
        else if (this.collection[index].min_rate === null && this.collection[index].max_rate !== null)
          modalRef.componentInstance.rate = this.collection[index].max_rate;
        else if (this.collection[index].min_rate !== null && this.collection[index].max_rate === null)
          modalRef.componentInstance.rate = this.collection[index].min_rate;
        else {
          if (this.collection[index].min_salary !== null && this.collection[index].max_salary !== null)
            modalRef.componentInstance.salary = this.collection[index].min_salary + "-" + this.collection[index].max_salary;
          else if (this.collection[index].min_salary === null && this.collection[index].max_salary !== null)
            modalRef.componentInstance.salary = this.collection[index].max_salary;
          else if (this.collection[index].min_salary !== null && this.collection[index].max_salary === null)
            modalRef.componentInstance.salary = this.collection[index].min_salary;
        }

        modalRef.componentInstance.stage = this.collection[index].stage.id;
        modalRef.componentInstance.resume = this.collection[index].resume;
        modalRef.componentInstance.candidate_full_name = this.collection[index].first_name + " " + this.collection[index].last_name;
        modalRef.componentInstance.candidate_id = candidate_id;
        modalRef.componentInstance.indexAsInput = candidate_id;
        modalRef.componentInstance.job_description = this.collection[index].job_description;
        modalRef.componentInstance.isPopup = true;
        if (evt === this.constants.ACTIVITY || evt === this.constants.REPOSITORY || evt === this.constants.ACTIVITY_INTERNAL) {
          modalRef.componentInstance.refreshListEvt.subscribe((res) => {
            this.fetchCollectionList();
          })
        }
        modalRef.result.then(res => {
          this.fetchCollectionList();
        }, error => {
          console.log(error);
        }
        );
      }

  }


  getRole(): void {
    this.auth.getRole().subscribe((res: Roles) => {
      if (res) {
        this.presentRole = res;
        //  console.log("role *********"+this.presentRole);
      }
    })
  }

  protected offSet(): number {
    return (this.page - 1) * this.limit;
}

  myCandidates(event: any) {
    console.log('inside my candidate')
    console.log(event);
    console.log('inside my candidate')
    let check = event.checked;
    this.isChecked = check;
    localStorage.setItem('isChecked', JSON.stringify(check));
    console.log('all candidate')
    console.log(this.isChecked)
    console.log('all candidate')

    var value = (document.getElementById('page-size') as HTMLSelectElement).value;
    this.limit = Number(value);

    this.sort = '-created_at';
    const sortSelect = document.getElementById('sortAs') as HTMLSelectElement;
    if (sortSelect) {
      sortSelect.value = 'true';
    }

    var url = this.api_path + "?action=my-candidates";
    let filterParams = this.filter?.path ? this.filter.path : '';
    if (check) {
      this.mycandidateCheck = true;
      this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit} &offset=${this.offSet()}&search=${this.search}&ordering=${this.sort}${filterParams}`);
      console.log("enter into if")
    }
    else if (!check) {
        this.mycandidateCheck = false;
        console.log("enter into else")
        this.fetchCollectionList(filterParams);
        console.log("enter into else")
    }
    localStorage.setItem('routerURL', this.routerURL);
 }

 pageChangeEventFunction(event: any){
  var value = (document.getElementById('page-size') as HTMLSelectElement).value;
  this.limit = Number(value);
  const sortSelect = document.getElementById('sortAs') as HTMLSelectElement;
  const sortValue = sortSelect?.value;
  const ordering = sortValue === 'true' ? '-created_at' : 'created_at';
  this.sort = ordering;
  var url = this.api_path + "?action=my-candidates";
  let filterParams = this.filter?.path ? this.filter.path : '';
  if(this.mycandidateCheck){
      this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit} &offset=${this.offSet()}&search=${this.search}&ordering=${this.sort}${filterParams}`);
  }else{
      this.fetchCollectionList(filterParams);
  }
 }

  searchWithFilters(): void {
    const filterParams = this.filter?.path || '';
    this.fetchCollectionList(filterParams);
  }
}
