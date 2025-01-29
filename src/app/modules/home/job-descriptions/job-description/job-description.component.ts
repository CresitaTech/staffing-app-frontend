import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Constants } from 'src/app/enums/constants.enum';
import { JobDescription } from 'src/app/models/job-description';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { JdassignAddListComponent } from '../assignment-list/jdassign-add-list/jdassign-add-list.component';
import { AddSubmissionComponent } from '../submission-list/add-submission/add-submission.component';
import { JobDescriptionDeleteComponent } from './job-description-delete/job-description-delete.component';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { APIPath } from 'src/app/enums/api-path.enum';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { CustomFilterInterface } from 'src/app/models/filters';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Filter } from 'src/app/enums/filter.enum';
import { JdImportComponent } from './jd-import/jd-import.component';
import { Roles } from './../../../../enums/role.enum';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignmentHistoryComponent } from './assignment-history/assignment-history.component';
import { CandidateDetailsComponent } from '../../dashboard/candidate-details/candidate-details.component';
import { Subscription } from 'rxjs';
import { Permission } from 'src/app/models/permission';
import * as moment from 'moment';
import { JobMatchCandidatesComponent } from './job-match-candidates/job-match-candidates.component';
import { Paging } from 'src/app/classes/paging';
import { JobDescriptionDetailsDialogComponent } from './job-description-details-dialog/job-description-details-dialog.component';
import { AlertService } from 'src/app/services/alert/alert.service';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' }

@Component({
  selector: 'app-job-description',
  templateUrl: './job-description.component.html',
  styleUrls: ['./job-description.component.scss'],
  providers: [OrderByDatePipe]
})
export class JobDescriptionComponent
  extends CustomFilterModel<JobDescription>
  implements OnInit, OnDestroy, CustomFilterInterface {

    allNewJobs =false;
    isChecked: boolean = false;

  api_path = APIPath.JOB_DESCRIPTION;
  @ViewChildren('mySelect') selects: QueryList<ElementRef>;

  @ViewChild(FilterComponent) filter: FilterComponent;
  Constants = Constants;
  enableAddButton = false;
  eventId: string;
  indexAsInput;
  current_job_id: string;
  role = Roles;
  presentRole;
  priority;
  formData: FormData;
  action;
  myActionFlag;
  totalJobs;
  bdmShortName;
  isPermission = false
  userCountry: string;
  currencyTag: string;
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  selectedIndex;
  notes;
  isDeleteDisabled: boolean;
  constructor(
    // private jobDescriptionService: JobDescriptionService,
    public modalService: NgbModal,
    _api: APIProviderService<JobDescription>,
    public _selectAll: SelectAllService,
    public auth: AuthService,
    private route: ActivatedRoute,
    public router: Router,
    public alert: AlertService,
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

  ngOnInit(): void {
    this.allNewJobs = true;
    this.getRole();
    this.routerURL = this.router.url.split("/")[4];
    if (this.routerURL === "myjobs") {
      this.myActionFlag = 'myJobs';
      console.log(this.routerURL)
      var url = "/reports/get_assinged_dashboard_list/" + "?action=myjobs";
      this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit}&offset=${this.offSet()}&search=&ordering=-created_at`);
    }
    else if (this.routerURL === "alljobs") {
      this.myActionFlag = 'allJobs';
      console.log(this.routerURL)
      var url = this.api_path + "?action=alljobs";
      this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit}&offset=${this.offSet()}&search=&ordering=-created_at`);
      console.log("========================> " + this.collectionSize)
    }
    else {
      this.fetchCollectionList();
    }

    this.totalJobs = this._api.getListAPI(APIPath.GET_DASHBOARD_SUMMARY)
      .subscribe((res: any) => {
        this.totalJobs = res.total_jobs
        console.log("========================> " + this.totalJobs)
        console.log(localStorage.getItem('bdmShortName'))
        if (localStorage.getItem('bdmShortName') == 'VV' || localStorage.getItem('bdmShortName') == 'VP' || localStorage.getItem('bdmShortName') == 'GA') {
          this.isPermission = true
        }

      });
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

    if(this.presentRole === this.role.ADMIN){
      this.isDeleteDisabled = false;
    }else{
      this.isDeleteDisabled = true;
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


  /**
   * on save / on edit, closes side panel and reloads page
   */
  refreshPage() {
    console.log("Inside Refresh Page")
    this.closeJobDescription();
    if (this.routerURL === "myjobs") {
      console.log("inside router URL" + "/home/" + this.api_path)
      this.routerURL = undefined;
      this.router.navigate(['/home/job-descriptions/job-description/']);
    }
    if (this.routerURL === "alljobs") {
      console.log("inside router URL" + "/home/" + this.api_path)
      this.routerURL = undefined;
      this.router.navigate(['/home/job-descriptions/job-description/']);
    }
    this.fetchCollectionList();

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

  closeJobDescription() {
    this.closeSidePane('addDobDescription');
    this.closeSidePane('addNotesOnJob');
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

  deleteJob(jobId: string) {
    this.deleteCollectionItem(jobId);
  }

  openDeleteModal(job: JobDescription) {
    if(!this.isDeleteDisabled){
      const modalRef = this.modalService.open(JobDescriptionDeleteComponent, _NgbModalOptions);
      modalRef.componentInstance.job = job;
      modalRef.result.then(res => {
        if (res.result) {
          this.deleteJob(res.id);
        }
      });
    }
  }

  // Side Add Candidate
  openNotesOnJobModel(event: string, index) {
    // this.current_job_id = this.collection[0].job_id;
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    this.selectedIndex = index;
    this.openSidePane('addNotesOnJob', 800);
  }

  // Side Filer section
  openFilters() {
    this.openSidePane('filters', 500);
  }

  closeFilters() {
    this.closeSidePane('filters');
  }


  openImportModal() {
    const modalRef = this.modalService.open(JdImportComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.result.then(res => {
      // alert("got it");
    });
  }


  openExport() {
    this.exportItem(APIPath.EXPORT_JD);
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


  myJobs(event : any) {
    let check = event.checked;
    console.log("value of check")
    console.log(event.checked)
    console.log("value of check")
    var url = "/reports/get_assinged_dashboard_list/" + "?action=myjobs";
      
    if(check){
      this.fetchCollectionListWithExactAPI(url + `&limit=10 &offset=${this.offSet()}&search=&ordering=-created_at`);
      
      console.log(this.fetchCollectionListWithExactAPI)
    }
    else if (!check){
      console.log("recruiter job data")
      this.fetchCollectionList(); 
      console.log("recruiter job data")
    }

    // this.myActionFlag = 'myJobs';
    // this.router.navigate(['/home/job-descriptions/job-description/myjobs']);
    // ======
    // var url='/reports/get_assinged_dashboard_list/'+"?action=myjobs";
    // this.fetchCollectionListWithExactAPI(url);
    // this.fetchCollectionListforParticularConditions(url);

  }


  protected offSet(): number {
    return (this.page - 1) * this.limit;
}

  allJobs(event: any) {
    this._selectAll.allJobsToogle = !this._selectAll.allJobsToogle;
    let check = event.checked;
    // this.myActionFlag = 'myJobs';
    var value = (document.getElementById('page-size') as HTMLSelectElement).value;
    this.limit = Number(value);
    var url = this.api_path + "?action=alljobs";  
    if(check){
      this.allJobsCheck = true;
      this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit}&offset=${this.offSet()}&search=${this.search}&ordering=-created_at`);
    }
    else if (!check){
      url = this.api_path + "?action=myjobs";
      this.allJobsCheck = false;
      this.fetchCollectionListWithExactAPI(this.api_path + `?limit=${this.limit}&offset=${this.offSet()}&search=${this.search}&ordering=${this.sort}`);
    }

    // this.router.navigate(['/home/job-descriptions/job-description/alljobs']);
  }

  openMatchedCandidatesOnJobModel(jd) {
    let modalRef;
    modalRef = this.modalService.open(JobMatchCandidatesComponent, _NgbModalOptions);
    modalRef.componentInstance.job_id = jd.id;
    modalRef.componentInstance.job_description = jd;
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
    if(evt === Constants.ASSIGNMENT){
    modalRef.componentInstance.isDisable = this.collection[index].status != "Active";

    modalRef.componentInstance.job_status = this.collection[index].status;

    modalRef.componentInstance.job_title = this.collection[index].job_title;
    }
    modalRef.componentInstance.job_id = this.collection[index].job_id;
    if (this.collection[index].default_assignee) { modalRef.componentInstance.assignee_name = this.collection[index].default_assignee; }
    if (this.collection[index].created_by) { modalRef.componentInstance.submission_assignee = this.collection[index].created_by; }
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {
      console.log(res);
    });

  }


  getRole(): void {
    this.auth.getRole().subscribe((res: Roles) => {
      if (res) {
        this.presentRole = res;
        console.log("role *********" + this.presentRole);
      }
      this.enableAddJobButton()
    })
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
      var oldStatus = item.status ;
        var segment = item.id + "/?action=JobStatus";
        item.status = (document.getElementById(idx) as HTMLSelectElement).value;
        console.log(segment + item.status);

        if (item.status === "Inactive") {
          this._api.getListAPI(APIPath.GET_JOB_CURRENT_STATUS + "?job_id=" + item.id)
            .subscribe((res: any) => {

              if (res && res.status === "error") {
                this.alert.error(res.message, this.options);
                (document.getElementById(idx) as HTMLSelectElement).value = item.status;
                // @ViewChild(idx, { static: true }) select: ElementRef;
                this.selects.forEach((select)=>{
                  console.log(select.nativeElement.id);
                  console.log(idx);
                  if (select.nativeElement.id === idx) {
                    select.nativeElement.value = oldStatus;
                    item.status = oldStatus;
                  }
                  // 
                });

              } else {
                this.patchSelectedItem(segment, { "status": item.status })
              }
            }, err => {
              (document.getElementById(idx) as HTMLSelectElement).value = item.status;
              this.selects.forEach((select)=>{
                console.log(select.nativeElement.id);
                if (select.nativeElement.id === idx) {
                  select.nativeElement.value = oldStatus;
                  item.status = oldStatus;
                }
                // 
              });
              console.log(err.message);

            })
        } else {
          this.patchSelectedItem(segment, { "status": item.status })
        }
      }
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
      modalRef.componentInstance.id = idx;
      modalRef.componentInstance.isPopup = true;
      modalRef.result.then(res => {

      }, error => {
        console.log(error);

      });
    })
  }

  subscription1$: Subscription;

  openDialog(job) {
    const modalRef = this.modalService.open(JobDescriptionDetailsDialogComponent, _NgbModalOptions);
    modalRef.componentInstance.job = job;
    modalRef.result.then(res => {
      if (res.result) {

      }
    });
  }

  cloneJob(jd) {
    var client_name = jd.client_name.id;
    var default_assignee = jd.default_assignee.id;
    jd.updated_by = null;
    jd.default_assignee = default_assignee;
    jd.created_by = null;
    jd.client_name = client_name;
    jd.id = null;
    jd.job_pdf = null;
    jd.job_recruiter_pdf = null;
    var date = moment(new Date()).format('YYYY-MM-DDTh:mm:ss');
    var createdDate = moment(new Date()).format('YYYYMMDDhhmmss');
    var year = date.split("-")[0];
    var month = date.split("-")[1];
    var furtherSplit = date.split("-")[2].split(":")[0];

    var getTime = date.split("-")[2].split(":")[1];
    var getfurtherTime = date.split("-")[2].split(":")[1].split(".")[0];
    jd.job_id = 'OPJDID' + this.bdmShortName + createdDate + this.totalJobs;

    this.subscription1$ = this._api.createCollectionItem(APIPath.JOB_DESCRIPTION, jd)
      .subscribe((res: any) => {
        this.refreshPage();
        // this.openJobDescription(Constants.EDIT,0 ) ;
      });
  }

  /*
  this.subscription1$ = this._api.createCollectionItem(APIPath.JOB_DESCRIPTION, jd)
  .subscribe((res: any) => {
   this.refreshPage();
   this.subscription2$=this._api.getCollectionItemById(APIPath.JOB_DESCRIPTION,res.id)
   .subscribe((res:any)=>{
     this.openJobDescription(Constants.EDIT,0 ) ;
   });
  });
  */

  ViewAssignmentHistory(idx: string) {
    this._api.getReportWithApiLink(`/jobdescriptions/get_job_assingment_history/?job_id=${idx}`).subscribe(_ => {
      const modalRef = this.modalService.open(AssignmentHistoryComponent, {
        backdrop: 'static',
        centered: true,
        keyboard: false,
        size: 'lg'

      });

      modalRef.componentInstance.history = _;
      modalRef.componentInstance.id = idx;
      modalRef.componentInstance.isPopup = true;
      modalRef.result.then(res => {

      }, error => {
        console.log(error);

      });
    })
  }

  /**
   * Enabling Add Job Description button for users
   * if user is not recruiter then the button should be enabled by default (as of now)
   * if user is recruiter then add button should check permission and then open add job form
   * @param userRole
   * @returns
   */
  public enableAddJobButton(): void {
    if (this.presentRole !== Roles.RECRUITER) {
      this.enableAddButton = true
    } else {
      // let sub$: Subscription;
      this.auth
        .getPermissions()
        .subscribe((permissions: Array<Permission>) => {
          // sub$.unsubscribe();
          if (permissions) {
            for (let i = 0; i < permissions.length; i++) {
              if (permissions[i].codename === 'add_jobmodel') {
                this.enableAddButton = true;
                break;
              }
            }
          }
        });
    }
  }
  pageChangeEventFunction(event: any){
    var value = (document.getElementById('page-size') as HTMLSelectElement).value;
    this.limit = Number(value);
    var url = this.api_path + "?action=alljobs";
    if(this.allJobsCheck){
        this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit} &offset=${this.offSet()}&search=&ordering=-created_at`);
    }else{
        this.fetchCollectionList()
    }
   }
  
}
