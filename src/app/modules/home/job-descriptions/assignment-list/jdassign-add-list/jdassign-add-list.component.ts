import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Filter } from 'src/app/enums/filter.enum';
import { Roles } from 'src/app/enums/role.enum';
import { Assignment } from 'src/app/models/assignment-list';
import { CustomFilterInterface } from 'src/app/models/filters';
import { JobDescription } from 'src/app/models/job-description';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { CandidateDetailsComponent } from '../../../dashboard/candidate-details/candidate-details.component';
import { AssignmentHistoryComponent } from '../../job-description/assignment-history/assignment-history.component';
import { JobDescriptionDeleteComponent } from '../../job-description/job-description-delete/job-description-delete.component';
import { AddSubmissionComponent } from '../../submission-list/add-submission/add-submission.component';
const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' }


@Component({
  selector: 'app-jdassign-add-list',
  templateUrl: './jdassign-add-list.component.html',
  styleUrls: ['./jdassign-add-list.component.scss']
})
export class JdassignAddListComponent extends CustomFilterModel<JobDescription> implements OnInit, CustomFilterInterface {

  @Input() job_pdf;
  @Input() uuid;
  @Input() job_id;
  @Input() indexAsInput: string;
  @Input() eventId: string;
  @Input() isDisable: boolean = false;
  @Input() job_status: string;
  @Input() job_title: string;
  @Output() refreshListEvt = new EventEmitter<any>();
  @ViewChild('closebutton') closebutton;
  //@Input() assignee_name;
  @Input() submission_assignee;
  // assignment = {} as Assignment;
  constants = Constants;
  Constants = Constants;
  subscription2$: Subscription;
  subscription1$: Subscription;
  jobPDFName;
  // collection: Array<any> = [];
  presentRole;
  role = Roles;
  userCountry: string;
  currencyTag: string;
  reviewError;
  api_path = APIPath.UNASSIGNED_JOBS_STATUS;
  totalJobs;
  bdmShortName;
  isPermission = false
  isAssignFromDialog = false
  priority;
  notes;
  // routerURL = "jd_assign_add_list_component";

  constructor(
    public service: APIProviderService<any>,
    public modalService: NgbModal,
    public activeModal: NgbActiveModal,
    public auth: AuthService,
    private route: ActivatedRoute,
    public router: Router,
    _selectAll: SelectAllService,
  ) {
    super(service, _selectAll);
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
        model: 'industrial_experience',
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
      { model: 'job_description' },
      { model: 'key_fields' },
      { model: 'revenue_frequency' },
      { model: 'employment_type' },
      { model: 'country', type: Filter.PICKER, },
      { model: 'contract_type' });
  }
  filter: FilterComponent;
  openFilter(): void {
    this.filter.toggle();
  }
  removeFilter(filter: string): void {
    // this.displayFilter.splice(this.displayFilter.findIndex((el: string) => el === event), 1);
    // delete this.filter.filters[event];
    this.filter.sendFilterEvt();
  }

  ngOnInit(): void {
    console.log(this.job_status)
    if (this.isDisable) {
      if(this.job_status === "SubmissionNotAccepted"){
        this.reviewError = "You can't assign this job. Because job is in 'Not Accepting Submissions' stage";
      }
      else if(this.job_status==="Inactive"){
        this.reviewError = "You can't assign this job. Because job is in 'In active' stage";
      }
      else if(this.job_status==="Rejected"){
        this.reviewError = "You can't assign this job. Because job is in 'Rejected' stage";
      }
      // this.reviewError = "You can't assign recruiter to this job because Job status is "+this.job_status === "SubmissionNotAccepted" ? "You can't assign recruiter to this job because Job status is Not Accepting Submissions" : this.job_status === "Inactive" ? "You can't assign recruiter to this job because Job status is In active" : this.job_status === "Rejected" ? "You can't assign recruiter to this job because Job status is Rejected":"";
    }
    this.routerURL = this.router.url.split("/")[3];
    console.log(this.routerURL)
    this.jobId = this.uuid;
    // this.api_path = APIPath.JOB_ASSIGNMENT+`?job_id=${this.uuid}`;
    this.getRole();
    this.routerURL = this.router.url.split("/")[4];

    // var url = this.api_path + "?action=alljobs";
    this.fetchCollectionList();
    // console.log("========================> " + this.collectionSize)


    // this.totalJobs=this._api.getListAPI(APIPath.GET_DASHBOARD_SUMMARY)
    // .subscribe((res:any)=>{
    //   this.totalJobs = res.total_jobs
    //   console.log("========================> " + this.totalJobs)
    //   console.log(localStorage.getItem('bdmShortName'))
    //   if(localStorage.getItem('bdmShortName') == 'VV' || localStorage.getItem('bdmShortName') == 'VP' || localStorage.getItem('bdmShortName') == 'GA'){
    //     this.isPermission = true
    //   }

    // });
    this.bdmShortName = localStorage.getItem('bdmShortName')
    console.log("user country: " + localStorage.getItem(Constants.USER_COUNTRY))
    this.userCountry = localStorage.getItem('user_country')
    console.log("userCountry: " + this.userCountry)
    if (this.userCountry == 'India') {
      this.currencyTag = "₹"
    } else {
      this.currencyTag = "$"
    }



    this.route.queryParams
      .subscribe(params => {
        console.log(params); // { priority: "true" }
        this.priority = params.priority;
      }
      );

    this.assignment.remarks = "";
    console.log("*********JD Assignment******");
    console.log(this.job_id + " " + this.uuid + " " + this.job_pdf)
    if (this.job_pdf != null)
      this.jobPDFName = this.job_pdf.split("/")[3];
    // if(this.assignee_name){
    //   this.assignment.assignee_name= this.assignee_name.first_name+" "+this.assignee_name.last_name;
    //   this.assignment.assignee_email= this.assignee_name.email;
    // }
    // if(this.submission_assignee){
    //   this.assignment.assignee_name= this.submission_assignee.first_name+" "+this.submission_assignee.last_name;
    //   this.assignment.assignee_email= this.submission_assignee.email;
    // }
    this.getUserLoggedInById(sessionStorage.getItem(Constants.USER_ID))
    // this.getUnassignedJobsStatus(this.uuid);
    // this.genUnassignedjobs();
    // this.getAssignmentyId(this.job_id);

  }

  getUserLoggedInById(index: string) {
    this.service.getCollectionItemById(APIPath.USERS, index).subscribe((res: any) => {
      // this.submission.recruiter_name= res.id;
      // this.submission.recruiter_email=res.email;
      this.assignment.assignee_name = res.first_name + " " + res.last_name;
      this.assignment.assignee_email = res.email;
    }, error => {
      console.log(error);
    })
  }

  getRole(): void {
    this.auth.getRole().subscribe((res: Roles) => {
      if (res) {
        this.presentRole = res;
        console.log("role *********" + this.presentRole);
      }
      // this.enableAddJobButton()
    })
  }
  enableAddJobButton() {
    throw new Error('Method not implemented.');
  }

  ngOnChanges(): void {
    // if (this.indexAsInput != undefined)
    //   this.getAssignmentyId(this.job_id);
    console.log("ngOnChanges");

    console.log(this.isAssignFromDialog && this.collection.length === 1 && this.eventId === this.constants.POP_UP);

    if (this.isAssignFromDialog && this.collection.length === 1 && this.eventId === this.constants.POP_UP) {
      this.closebutton.nativeElement.click();
    }

  }


  getAssignmentyId(index: string) {
    this.service.getCollectionItemById(APIPath.JOB_ASSIGNMENT, index).subscribe((res) => {
      this.assignment = res;
    }, error => {
      console.log(error);
    })
  }

  getUnassignedJobsStatus(jobId: string) {
    console.log("getUnassignedJobsStatus");
    this.service.getCollectionItemByJobId(APIPath.UNASSIGNED_JOBS_STATUS, jobId.toLowerCase()).subscribe((res) => {

      if (res && res.last_assigned_recruiter && res.last_assigned_recruiter.length > 0) {
        this.assignment.primary_recruiter_name = res.last_assigned_recruiter[0].primary_recruiter_name;
        this.assignment.secondary_recruiter_name = res.last_assigned_recruiter[0].secondary_recruiter_name;
        this.assignment.primary_recruiter_email = res.last_assigned_recruiter[0].primary_recruiter_email;
        this.assignment.secondary_recruiter_email = res.last_assigned_recruiter[0].secondary_recruiter_email;
      }
      this.collection = res.number_of_unassigned_jobs;
      console.log(this.assignment);

    }, error => {
      console.log(error);
    })
  }

  genUnassignedjobs() {

    this.service.getListAPI(`${APIPath.JOB_DESCRIPTION}?limit=10&offset=0&search=&ordering=-created_at`).subscribe((res) => {
      if (res && res.results.length > 0) {
        this.collection = res.results;
      }
    }, error => {
      console.log(error);
    })
  }




  onEdit() {
    this.subscription2$ = this.service.putIdAPI
      (APIPath.JOB_ASSIGNMENT, this.indexAsInput, this.assignment).subscribe((res) => {
        this.refreshOnModifyOrAdd();
      }, error => { console.log(error); })
  }



  onSubmit() {
    this.assignment.job_id = this.uuid;
    console.log("*******assignment******");
    console.log(this.assignment);
    this.subscription1$ = this.service.postAPI(APIPath.JOB_ASSIGNMENT, this.assignment)
      .subscribe((res: any) => {
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);
      });
  }



  refreshOnModifyOrAdd() {
    this.assignment = {} as Assignment
    this.refreshListEvt.emit(null);
    if (this.eventId === this.constants.POP_UP) {
      this.closebutton.nativeElement.click();
    }
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


  doAction(evt: string, index) {
    let modalRef;
    switch (evt) {
      case Constants.ASSIGNMENT: {
        modalRef = this.modalService.open(JdassignAddListComponent, { backdrop: 'static', keyboard: false, size: 'xl' });
        break;
      }
      case Constants.SUBMISSION: {
        modalRef = this.modalService.open(AddSubmissionComponent, _NgbModalOptions);
        modalRef.componentInstance.actionName = Constants.SUBMISSION;

        break;
      }
    }
    console.log("**************Job Description*******");
    console.log(this.collection[index].id)
    const uuid = this.collection[index].id;
    modalRef.componentInstance.uuid = uuid;
    modalRef.componentInstance.job_pdf = this.collection[index].job_pdf;
    modalRef.componentInstance.job_id = this.collection[index].job_id;
    if (this.collection[index].default_assignee) { modalRef.componentInstance.assignee_name = this.collection[index].default_assignee; }
    if (this.collection[index].created_by) { modalRef.componentInstance.submission_assignee = this.collection[index].created_by; }
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.isPopup = true;
    this.isAssignFromDialog = true;
    modalRef.result.then((result) => {
      this.fetchCollectionList();
    }).catch((res) => {
      this.fetchCollectionList();
      console.log(res);
    });

  }


  openDeleteModal(job: JobDescription) {
    const modalRef = this.modalService.open(JobDescriptionDeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.job = job;
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteJob(res.id);
      }
    });
  }

  deleteJob(jobId: string) {
    this.deleteCollectionItem(jobId);
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

  // Side Add Candidate
  openJobDescription(event: string, index) {
    // this.current_job_id = this.collection[0].job_id;
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    this.openSidePane('addDobDescription', 800);
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
  openRowDetailJd(index) {

    console.log("================ " + this.collection[index].id)
    // this.selectedItemIndex = index

    this._api.getListAPI(APIPath.JOB_DESCRIPTION_NOTES + '?job_id=' + this.collection[index].id)
      .subscribe((res: any) => {
        this.notes = res.results
        console.log("========================> " + JSON.stringify(res.results))
      });

  }
  selectHandler(): void {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    (actionValue === "delete") ?
      this.massDeleteSelectedCollectionItem() :
      this.setSelectedToHighPriority();
  }

  setSelectedToHighPriority() {

    this.collectionMapForSelectFlag.forEach((value, key) => {
      if (value === true) {
        if (this.collectionMapForPriority.has(key) && this.collectionMapForPriority.get(key) == false)
          this.onPriorityChange(key);

      }
    }
    )
    this.fetchCollectionList();

    // this.collection.forEach((item) => {
    //     if (item['isSelected'] == true && item.priority==false) {
    //       this.onPriorityChange(item.id);
    //     }
    // });

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

}
