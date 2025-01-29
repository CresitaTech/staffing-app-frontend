import { Component, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { APIPath } from 'src/app/enums/api-path.enum';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { CustomFilterInterface } from 'src/app/models/filters';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Filter } from 'src/app/enums/filter.enum';
import { DocViewerComponent } from 'src/app/components/doc-viewer/doc-viewer.component';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Roles } from 'src/app/enums/role.enum';
import { Candidate } from 'src/app/models/candidate';
import { Constants } from 'src/app/enums/constants.enum';
import { SendMailComponent } from '../../../candidates/candidate/send-mail/send-mail.component';
import { SubmissionDetailsComponent } from '../../../candidates/candidate/submission-details/submission-details.component';
// import { AddActivityComponent } from '../../../candidates/activity/add-activity/add-activity.component';


@Component({
  selector: 'app-job-match-candidates',
  templateUrl: './job-match-candidates.component.html',
  styleUrls: ['./job-match-candidates.component.scss']
})


export class JobMatchCandidatesComponent
  extends CustomFilterModel<Candidate>
  implements OnInit, OnDestroy, CustomFilterInterface {


  /**
   * Required field
   */
  api_path = APIPath.CANDIDATE;

  @ViewChild(FilterComponent) filter: FilterComponent;
  constants = Constants;
  filterQueryString: string = '';
  eventId: string;
  indexAsInput;
  tagName;
  candidatesArray: any = { '': '' };
  candidatesNameArray: any = [];
  candidatesIdArray: any = [];
  mailAddress: string;
  role = Roles;
  @Input() job_id;
  @Input() job_description;
  presentRole;
  collection;
  refreshListEvt = new EventEmitter<any>();

  constructor(
    _api: APIProviderService<Candidate>,
    _selectAll: SelectAllService,
    private router: Router,
    public activeModal: NgbActiveModal,
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
      { model: 'client_name' },
      { model: 'qualification' },
      { model: 'visa' });

  }


  ngOnInit(): void {
    //this.filterCandidates(this.job_id)
    this.routerURL = this.router.url.split("/")[4];
    this.fetchCollectionBestJobsList(this.job_id)

    console.log('list oninit: ' + this.eventId)
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


  openExport() {
    this.exportItem(APIPath.EXPORT_CANDIDATE);
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


  doAction(evt: string, index) {
    console.log("action called");
    const options: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' };
    switch (evt) {
      case this.constants.SUBMITTED_FOR: {
        var modalRef = this.modalService.open(SubmissionDetailsComponent, options)
        break;
      }
//       case this.constants.ACTIVITY: {
//         var modalRef = this.modalService.open(AddActivityComponent, options);
//         const candidate_id = this.collection[index].id;
//         const candidate_name = this.collection[index].first_name;
//         modalRef.componentInstance.eventId = Constants.ADD;
//         modalRef.componentInstance.candidate_name = candidate_name;
//         modalRef.componentInstance.candidate_id = candidate_id;
//         modalRef.componentInstance.indexAsInput = candidate_id;
//         modalRef.componentInstance.job_description = this.job_description;
//         modalRef.componentInstance.stage = this.collection[index].stage.id;
//         break;
//       }
      case this.constants.DELETE: {
        var modalRef = this.modalService.open(DeleteComponent, { backdrop: 'static', centered: true, keyboard: false });
        break;
      }

    }

    if (evt === this.constants.DELETE) {
      modalRef.componentInstance.id = index;
      modalRef.componentInstance.title = Constants.CANDIDATE;
      this.collection.forEach(item => {
        if (item.id === index) { modalRef.componentInstance.name = item.first_name; }
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
      modalRef.componentInstance.eventId = Constants.ADD;
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
      // modalRef.componentInstance.job_description = this.collection[index].job_description;
      modalRef.componentInstance.isPopup = true;
      if (evt === this.constants.ACTIVITY || evt === this.constants.REPOSITORY) {
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

  myCandidates() {
    this.router.navigate(['/home/candidates/candidate/my-candidates']);
  }
}
