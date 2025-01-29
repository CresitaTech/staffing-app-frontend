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
import { SubmissionDetailsComponent } from '../../../candidates/candidate/submission-details/submission-details.component';
import { SendMailComponent } from '../../../candidates/candidate/send-mail/send-mail.component';
import { AssignmentHistoryComponent } from '../../../job-descriptions/job-description/assignment-history/assignment-history.component';
import { CandidateDetailsComponent } from '../../../dashboard/candidate-details/candidate-details.component';
import { AddActivityComponent } from '../../activity/add-activity/add-activity.component';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' }


@Component({
  selector: 'app-candidate-match-for-job',
  templateUrl: './candidate-match-for-job.component.html',
  styleUrls: ['./candidate-match-for-job.component.scss']
})
export class CandidateMatchForJobComponent
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
  @Input() candidate_id;
  presentRole;
  collection;

  Constants = Constants;
  enableAddButton = false;
  current_job_id: string;
  priority;
  formData: FormData;
  action;
  myActionFlag;
  totalJobs;

  refreshListEvt = new EventEmitter<any>();

  constructor(
    _api: APIProviderService<Candidate>,
    _selectAll: SelectAllService,
    private router: Router,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    public auth: AuthService

  ) {

    super(_api, _selectAll);
    this.filterOn.push(
      //   {
      //   model: 'industry_experience',
      //   type: Filter.RANGE,
      //   range: { start: 0, end: 10, param: 'In Years' }
      // },
      { model: 'job_title' },
      { model: 'location' },
      { model: 'primary_recruiter_name' },
      { model: 'visa_type' },
      {
        model: 'years_of_experience',
        type: Filter.RANGE,
        range: { start: 0, end: 10, param: 'In Years' }
      },
      {
        model: 'rate',
        type: Filter.RANGE2,
        range: { start: 0, end: 10, param: 'In $' }
      },
      {
        model: 'salary',
        type: Filter.RANGE2,
        range: { start: 0, end: 10, param: 'In $' }
      },
      {
        model: 'projected_revenue',
        type: Filter.RANGE,
        range: { start: 0, end: 10, param: 'In $' }
      },
      { model: 'client_name' },
      { model: 'visa_type' },
      { model: 'key_skills' },
      { model: 'education_qualificaion' },
      { model: 'revenue_frequency' },
      { model: 'contract_type' });

  }


  ngOnInit(): void {
    //this.filterCandidates(this.job_id)
    this.routerURL = this.router.url.split("/")[4];
    this.fetchCollectionRecommendedJobsList(this.candidate_id)


    console.log('list oninit: ' + this.eventId)
  }

  ngOnDestroy(): void {
    this.unsubscribeDeleteSub();
    if (this.fetchSub) this.fetchSub.unsubscribe();
  }


  openFilter(): void {
    this.filter.toggle();
  }

  closeAddActivityStatus() {
    this.closeSidePane("addActivityStatus");
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


  onPriorityChange(idx: string) {
    this.collection.forEach(item => {
      if (item.id === idx) {
        if (item.priority === true) {
          item.priority = false;
        }
        else {
          item.priority = true;
        }
        var id = item.id + "/?action=Priority";

        this.patchSelectedItem(id, { "priority": item.priority });

      }
    })
  }


  onStatusChange(idx: string) {
    this.collection.forEach(item => {
      if (item.id === idx) {
        console.log(item);
        var segment = item.id + "/?action=JobStatus";
        item.status = (document.getElementById(idx) as HTMLSelectElement).value;
        console.log(segment + item.status);
        this.patchSelectedItem(segment, { "status": item.status })
      }
    })

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
    console.log("action called: " + index);
    const options: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' };
    switch (evt) {
      case this.constants.SUBMITTED_FOR: {
        var modalRef = this.modalService.open(SubmissionDetailsComponent, options)
        break;
      }
      case this.constants.ACTIVITY: {
        var modalRef = this.modalService.open(AddActivityComponent, options);

        const candidate_id = this.candidate_id;
        const candidate_name = this.collection[index].first_name;
        modalRef.componentInstance.eventId = Constants.POP_UP;
        modalRef.componentInstance.candidate_name = candidate_name;
        modalRef.componentInstance.candidate_id = candidate_id;
        modalRef.componentInstance.indexAsInput = candidate_id;
        modalRef.componentInstance.job_description= this.collection[index];
        modalRef.componentInstance.stage = this.collection[index].stage.id;

        break;
      }
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



  ViewAssignmentHistory(idx: string) {
    this._api.getReportWithApiLink(`/jobdescriptions/get_job_assingment_history/?job_id=${idx}`).subscribe(_ => {
      const modalRef = this.modalService.open(AssignmentHistoryComponent, {
        backdrop: 'static',
        centered: true,
        keyboard: false,
        size: 'lg'

      });

      modalRef.componentInstance.history = _;
      modalRef.componentInstance.isPopup = true;
      modalRef.result.then(res => {

      }, error => {
        console.log(error);

      });
    })
  }


  ViewAllCandidates(idx: string) {
    this._api.getReportWithApiLink(`/candidates/get_all/?job_id=${idx}`).subscribe(_ => {
      const modalRef = this.modalService.open(CandidateDetailsComponent, {
        backdrop: 'static',
        centered: true,
        keyboard: false,
        size: 'lg'

      });
      _.forEach(_ => {
        Object.keys(_).forEach(key => {
          // && key!=="Candidate Added"
          if (_[key] === null)
            _[key] = "--";
        });
      });

      _.forEach(item => {

        if (item.first_name) {
          item.full_name = item.first_name + " " + item.last_name;
        }
        if (item.submission_date) {
          item.submission_date = item.submission_date.split(" ")[0];
        }
        if (item.updated_at) {
          item.updated_at = item.updated_at.split(" ")[0];
        }
      });

      modalRef.componentInstance.candidates = _;
      modalRef.componentInstance.tag = 'job_wise_candidates';
      modalRef.componentInstance.isPopup = true;
      modalRef.result.then(res => {

      }, error => {
        console.log(error);

      });
    })
  }



}
