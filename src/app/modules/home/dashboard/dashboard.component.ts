import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { forkJoin, Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Roles } from 'src/app/enums/role.enum';
import { Candidate } from 'src/app/models/candidate';
import { Client } from 'src/app/models/client';
import { DashboardJobs } from 'src/app/models/dashboardJobs';
import { GlobalApiResponse } from 'src/app/models/global_api_response';
import { JobDescription } from 'src/app/models/job-description';
import { User } from 'src/app/models/user';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { AddCandidateComponent } from '../candidates/candidate/add-candidate/add-candidate.component';
import { AddCardComponent } from '../candidates/placement-card/add-card/add-card.component';
import { JobDescriptionDetailComponent } from '../job-descriptions/job-description/job-description-detail/job-description-detail.component';
import { CandidateDetailsComponent } from './candidate-details/candidate-details.component';
import { MyJobsComponent } from './my-jobs/my-jobs.component';
import { UnassignedJobsComponent } from './unassigned-jobs/unassigned-jobs.component';
import { AddActivityComponent } from '../candidates/activity/add-activity/add-activity.component';
import { Assignment } from 'src/app/models/assignment-list';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  // styles: [
  //   `
  //     .statistics-value-sm {
  //       font-size: 1.25rem !important;
  //       font-weight: 600;
  //       line-height: 2.5rem;
  //     }
  //   `
  //]
})
export class DashboardComponent implements OnInit, OnDestroy {

  jobs: Array<any> = [];
  priorityJobs: Array<any> = [];
  unAssignedJobs: Array<any> = [];
  priority_jobs: Array<JobDescription> = [];
  recruiterJobs: Array<DashboardJobs> = [];
  placement: Array<any>;
  clients: Array<Client> = [];
  candidates: Array<any> = [];
  Constants = Constants;

  component: string = null;
  aggrated: any;
  role: Roles;
  forkJoinSubscription: Subscription
  roles = Roles;
  pageToBeLoaded = 'dashboard';
  assignment: any;

  constructor(
    private _api: APIProviderService<any>,
    private auth: AuthService,
    private modalService: NgbModal,
  ) { }




  ngOnInit(): void {
    this.getRole();
// this.getUserLoggedInById();

  }
  ngOnDestroy(): void {
    //console.log('On Destro Called')
    this.forkJoinSubscription.unsubscribe();

  }


  getUserList(): void {
    const user_api_path = APIPath.USERS;
    this._api.getListAPI(user_api_path).subscribe((res: Array<any>) => {
      const collection = res['results'] ? res['results'] : res;
      /*collection.forEach(user => {
        console.log(user.first_name + " " + user.last_name)
      });*/
      // console.log(collection)
    })
  }

//   getUserLoggedInById(){
//     this._api.getCollectionItemById(APIPath.USERS,sessionStorage.getItem(Constants.USER_ID)).subscribe((res:any)=>{
//       sessionStorage.setItem(Constants.USER_ID, res.country);
//         }, error=>{
//       console.log(error);    
// })
//   }

  

  getInitialData(role) {
    console.log("role-")
    console.log(role)
    if (role === Roles.ADMIN) {
      console.log('admin')
      const request = [
        this._api.getReportWithApiLink(`/reports/get_top_five_placement/`),
        // this._api.getReportWithApiLink(APIPath.JOB_DESCRIPTION + `?offset=0&limit=5&ordering=-created_at`),
        this._api.getReportWithApiLink(APIPath.ASSIGNED_UNASSIGNED_JOBS + `?offset=0&limit=5&ordering=-created_at`),
        this._api.getReportWithApiLink('/reports/get_dashboard_data/'),

      ]
      forkJoin(request).subscribe((res: Array<any>) => {
        this.placement = res[0];
        this.jobs = res[1];
        this.jobs.forEach(job => {
          job.posted_date = job.posted_date.replace(' ', 'T');
          job.posted_date = job.posted_date.concat('Z')
          if (job.assinged_date !== null) {
            job.assinged_date = job.assinged_date.replace(' ', 'T');
            job.assinged_date = job.assinged_date.concat('Z')
          }
        })
        //console.log(this.jobs);
        this.aggrated = res[2];
      })
    } else if (role === Roles.RECRUITER) {
      console.log("in recr");
      const request = [
        this._api.getReportWithApiLink(APIPath.RECRUITER_JOBS),
        this._api.getReportWithApiLink(`/reports/get_my_candidates/`),
        this._api.getReportWithApiLink('/reports/get_dashboard_data/'),
      ]
      forkJoin(request).subscribe((res: Array<any>) => {
        this.recruiterJobs = res[0];
        this.recruiterJobs.forEach(job => {
          if (job.assinged_date !== null) {
            job.assinged_date = job.assinged_date.replace(' ', 'T');
            job.assinged_date = job.assinged_date.concat('Z')
          }
        })
        // console.log(this.recruiterJobs)
        this.candidates = res[1];
        this.aggrated = res[2];
      })
    } else {
      // console.log('mngr')
      var request;
      if(role === Roles.BDMMANAGER){
       request = [
        // this._api.getReportWithApiLink(APIPath.JOB_DESCRIPTION + `?offset=0&limit=5&ordering=-created_at`),
        this._api.getReportWithApiLink(APIPath.ASSIGNED_UNASSIGNED_JOBS + `?offset=0&limit=5&ordering=-created_at`),
        this._api.getReportWithApiLink('/reports/get_top_clients/'),
        this._api.getReportWithApiLink('/reports/get_dashboard_data/'),
        this._api.getReportWithApiLink(APIPath.JOB_DESCRIPTION + `?offset=0&limit=5&ordering=-created_at&priority=true`),
        this._api.getReportWithApiLink('/reports/get_top_five_high_priority_jobs/'),
      ]
    }else{
      request = [
        // this._api.getReportWithApiLink(APIPath.JOB_DESCRIPTION + `?offset=0&limit=5&ordering=-created_at`),
        this._api.getReportWithApiLink(APIPath.ASSIGNED_UNASSIGNED_JOBS + `?offset=0&limit=5&ordering=-created_at`),
        this._api.getReportWithApiLink('/reports/get_top_clients/'),
        this._api.getReportWithApiLink('/reports/get_dashboard_data/'),
        this._api.getReportWithApiLink(APIPath.JOB_DESCRIPTION + `?offset=0&limit=5&ordering=-created_at&priority=true`),
      ]
    }
      forkJoin(request).subscribe((res: Array<any>) => {
        this.jobs = res[0];
        this.jobs.forEach(job => {
          job.posted_date = job.posted_date.replace(' ', 'T');
          job.posted_date = job.posted_date.concat('Z')
          if (job.assinged_date !== null) {
            job.assinged_date = job.assinged_date.replace(' ', 'T');
            job.assinged_date = job.assinged_date.concat('Z')
          }
        })
        this.clients = res[1];
        this.aggrated = res[2];
        if(role === Roles.BDMMANAGER){
          this.priorityJobs = res[4];
          // this.priorityJobs.forEach(job => {
          //   job.posted_date = job.posted_date.replace(' ', 'T');
          //   job.posted_date = job.posted_date.concat('Z')
          //   if (job.assinged_date !== null) {
          //     job.assinged_date = job.assinged_date.replace(' ', 'T');
          //     job.assinged_date = job.assinged_date.concat('Z')
          //   }
          // })
        }else{
          this.priority_jobs = res[3].results;
        }
        // console.log(this.jobs)
       
       

      }, error => {
        console.log(error);
      })
    }
  }
  eventId: string = undefined;

  openComponent(component: string): void {
    // console.log("inside opencomponent" + component)
    this.eventId = Constants.ADD;
    this.component = component;
    document.getElementById("addComponent").style.width = "800px";
  }



  closeComponent(): void {
    document.getElementById("addComponent").style.width = "0";
  }

  getRole(): void {
    this.forkJoinSubscription = this.auth.getRole().subscribe((res: Roles) => {
      if (res) {
        //console.log("inside getRole")
        this.role = res;
        this.getInitialData(res);
      }
    })
  }


  patchSelectedItem(id: string, collection: any): void {
    this._api.patchCollectionItemById(APIPath.JOB_DESCRIPTION, id, collection).subscribe((res: any) => {
      this._api.getReportWithApiLink(APIPath.JOB_DESCRIPTION + `?offset=0&limit=5&ordering=-created_at&priority=true`).subscribe(_ => {
        this.priority_jobs = _.results;
      })
    })
  }

  openModal(id: string, action: string) {
    console.log(action);
    var modalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false, size: 'lg' }
    if (action === Constants.JD) {
      var modalRef = this.modalService.open(JobDescriptionDetailComponent, modalOptions);
    }
    else if (action === Constants.CANDIDATE) {
      var modalRef = this.modalService.open(AddCandidateComponent, modalOptions);
    }
    else if (action === Constants.CANDIDATE_STATUS) {
      var modalRef = this.modalService.open(AddActivityComponent, modalOptions);
    }
    // else if(action===Constants.CARD){
    // var modalRef = this.modalService.open(AddCardComponent, modalOptions);
    // }

    console.log("step1");
    console.log(modalRef);
    modalRef.componentInstance.indexAsInput = id;
    console.log("step2");
    modalRef.componentInstance.eventId = Constants.EDIT_POP_UP;
    console.log("step3");
    //modalRef.componentInstance.action = 'view';
    modalRef.componentInstance.isPopup = true;
    console.log("step4");
    modalRef.componentInstance.refreshListEvt.subscribe((res) => {
      this.modalService.dismissAll();
      this.getInitialData(this.role);
      // if(action===Constants.CANDIDATE){
      //   this._api.getReportWithApiLink(APIPath.CANDIDATE + `?offset=0&limit=5&ordering=-created_at`).subscribe(_=>{
      //     this.candidates=_.results;
      //   })
      //   }
      // if(action===Constants.JD){

      // }
    })

    modalRef.result.then(res => {

    }, error => {
      console.log(error);

    });

  }

  openUnassignedJobs() {
    const modalRef = this.modalService.open(UnassignedJobsComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg'

    });
    this.unAssignedJobs = this.jobs.filter(_ => {
      if (_.primary_recruiter_name === null && _.secondary_recruiter_name === null) {
        _.posted_date = moment(_.posted_date).format('MM/DD/YYYY');
        return _;
      }
    })
    modalRef.componentInstance.jobs = this.unAssignedJobs;
    modalRef.componentInstance.isPopup = true;
    modalRef.componentInstance.toDisplay = 'job';
    modalRef.result.then(res => {

    }, error => {
      console.log(error);

    });

  }


  openClients() {
    const modalRef = this.modalService.open(UnassignedJobsComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg'

    });
    modalRef.componentInstance.clients = this.clients;
    modalRef.componentInstance.isPopup = true;
    modalRef.componentInstance.toDisplay = 'client';
    modalRef.result.then(res => {

    }, error => {
      console.log(error);

    });

  }

  openMyCandidates() {
    const modalRef = this.modalService.open(CandidateDetailsComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg'

    });
    this.candidates.forEach(val => {
      val.submission_date = moment(val.submission_date).format('MM/DD/YYYY');
      val.last_updated = moment(val.last_updated).format('MM/DD/YYYY');
      //console.log(val.submission_date)
      //console.log(val.last_updated)
    }
    )
    modalRef.componentInstance.candidates = this.candidates;
    modalRef.componentInstance.tag = 'dashboard_recruiter';
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {

    }, error => {
      console.log(error);

    });
  }


  openMyJobs() {
    const modalRef = this.modalService.open(MyJobsComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg'

    });
    this.recruiterJobs.forEach(val => {
      val.assinged_date = moment(val.assinged_date).format('MM/DD/YYYY');
    }
    )
    modalRef.componentInstance.jobs = this.recruiterJobs;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {

    }, error => {
      console.log(error);

    });
  }


  onPriorityChange(idx: string) {
    this.priority_jobs.forEach(item => {
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
