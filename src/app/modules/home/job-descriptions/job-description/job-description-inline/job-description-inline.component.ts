import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Roles } from 'src/app/enums/role.enum';
import { InlineComponent } from 'src/app/models/inline-component';
import { JobDescription } from 'src/app/models/job-description';
import { OrderByDatePipe } from 'src/app/pipes/order-by/order-by-date.pipe';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { JobDescriptionService } from 'src/app/services/job-description/job-description.service';
import { JobDescriptionDeleteComponent } from '../job-description-delete/job-description-delete.component';
import { JobDescriptionDetailComponent } from '../job-description-detail/job-description-detail.component';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', keyboard: false, size: 'lg' }

@Component({
  selector: 'app-job-description-inline',
  template: `
    <div class="form-row">
      <div class="col form-group">
        <!--<label *ngIf="stage!==constants.DEFAULT_STAGE && stage" class="asterisk-if-mandatory">Job Description</label>
        <label *ngIf="stage===constants.DEFAULT_STAGE || !stage" class="asterisk-if-mandatory" >Job Description</label>-->
        
        <label *ngIf="stage!==constants.DEFAULT_STAGE && stage" class="asterisk-if-mandatory">Job Description</label>
        <label *ngIf="stage===constants.DEFAULT_STAGE || !stage" class="asterisk-if-mandatory">Job Description</label>

        <div class="form-row">
          <div class="col jd-selectbox"> <!--[required]="stage!==constants.DEFAULT_STAGE?true:false" -->
            <ng-select [disabled] ="disabled" #select [items]="collection" [searchable]="false" [(ngModel)]="item"  [searchFn]="customSearchFn" (ngModelChange)="change($event);" 
            bindLabel="job_title" bindValue="id" [required]="isRequired"
            #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
              <ng-template ng-header-tmp >
                <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)"/>
              </ng-template>
              <ng-template  ng-label-tmp let-item="item" >
                <span >{{ item.client_name + '-' +item.job_title }}</span>
              </ng-template>
              <ng-template ng-option-tmp let-item="item" let-search="searchTerm" let-index="index">
                <span >{{ item.client_name + '-' +item.job_title }}</span>
              </ng-template>
            </ng-select>
           
            
          </div>
          <div class="col-auto" *ngIf="presentRole!==role.RECRUITER && !disabled">
            <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom"
              title="Add Another Client"  (click)="openCreateModal()">
              <i class="fas fa-plus-square"></i>
            </button>
          </div>
          <div class="col-auto" *ngIf="presentRole!==role.RECRUITER && !disabled">
            <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom"
              title="Change Selected Client" [disabled]="!selectedElement" (click)="openEditModal()">
              <i class="fas fa-highlighter text-light"></i>
            </button>
          </div>
          <div class="col-auto" *ngIf="presentRole!==role.RECRUITER && !disabled">
            <button type="button" class="btn btn-danger" data-tooltip="tooltip" data-placement="bottom"
              title="Delete Selected Client" [disabled]="!selectedElement" (click)="openDeleteModal()">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div> 
  `,
  styles: [
  ],
  providers: [OrderByDatePipe]
})
export class JobDescriptionInlineComponent extends Paging<JobDescriptionService> implements OnInit, OnDestroy, InlineComponent {

  api_path = APIPath.JD_DROPDOWN;
  presentRole;
  role=Roles;
  constants=Constants;
  @Input() item: number;
  @Output() changeItemEvt = new EventEmitter<number>();
  @Output() emitJDName=new EventEmitter<any>();
  @Input() job_description;
  @Input() stage:string;
  @Input() disabled:boolean = false;
 // @Input() candidate_id:string;
  private getSub: Subscription;
  private deleteSub: Subscription;
  list: Array<any>;
  selectedElement: number;
  isRequired: boolean = true

  constructor(
    private modalService: NgbModal,
    private orderByDatePipe: OrderByDatePipe,
    _api: APIProviderService<JobDescriptionService>,
    _selectAll: SelectAllService,
    public auth:AuthService
  ) {
    super(_api, _selectAll)
  }

  ngOnInit(): void {
    //console.log(this.item)
    this.fetchCollectionListForDropDowns(this.api_path);
    this.getRole();
 

  }

  customSearchFn(term: string, item: any) {
  
    term = term.toLocaleLowerCase();
    return (item && item !== null && item.client_name && item.client_name !== null && item.client_name.toLocaleLowerCase().indexOf(term) > -1) || 
           (item && item !== null && item.job_title && item.job_title !== null && item.job_title.toLocaleLowerCase().indexOf(term) > -1);
   }

  ngOnDestroy(): void {
    this.unsubscribeDeleteSub();
    if (this.fetchSub) this.fetchSub.unsubscribe();
  }

  change(event): void {
    this.selectedElement = event;
    this.isRequired = false
    this.emitChange(event);
  }

  emitChange(event): void {
    this.changeItemEvt.emit(event);
    var temp=this.collection.filter(_=>
      {if(_.id===event){
         return _;
      }})
      console.log("temp");
      console.log(temp);
    this.emitJDName.emit(temp);
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(JobDescriptionDetailComponent, _NgbModalOptions);
    modalRef.componentInstance.eventId = Constants.ADD;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    // modalRef.componentInstance.current_job_id = this.list[this.list.length-1].job_id;
    modalRef.componentInstance.refreshListEvt.subscribe((res) => {
      this.fetchCollectionListForDropDowns(this.api_path);
    })
    // modalRef.result.then(res => {
    //   this.item = this.selectedElement = res.id;
    //   this.emitChange(this.item);
    //   this.fetchCollectionListForDropDowns(this.api_path);
    // });
  }

  openEditModal(): void {
    const modalRef = this.modalService.open(JobDescriptionDetailComponent, _NgbModalOptions);
    modalRef.componentInstance.eventId = Constants.EDIT;
    modalRef.componentInstance.indexAsInput = this.selectedElement;
    modalRef.componentInstance.isPopup = true;
    modalRef.componentInstance.refreshListEvt.subscribe(res => {
      this.item = this.selectedElement;
      this.emitChange(this.item);
      this.fetchCollectionListForDropDowns(this.api_path)});
  }

  openDeleteModal(): void {
    const modalRef = this.modalService.open(JobDescriptionDeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.job = this.collection.filter(l => l.id === this.selectedElement)[0];
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteItem(res.id);
      }
    });
  }


  deleteItem(id: string) {
    this.deleteCollectionItemForExactAPISent(APIPath.JOB_DESCRIPTION, id);
    this.item=null;
    this.emitChange(null);
  }

  getRole(): void {
    this.auth.getRole().subscribe((res: Roles) => {
      if (res) {
        this.presentRole = res;
      }
    })
}

}

/*
USE THIS CODE IF WANT  MULTI SELECT JD FUNCTIONALITY
*/
// <ng-select [multiple]="true"  #select [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
// bindLabel="job_title" bindValue="id" required 
// #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
//   <ng-template ng-header-tmp  >
//     <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)"/>
//   </ng-template>
//   <ng-template  ng-label-tmp let-item="item" let-clear="clear">
//   <span class="ng-value-icon right" (click)="clear(item)" aria-hidden="true">×</span>
//     <span >{{ item.client_name + '-' +item.job_title }}</span>
//   </ng-template>
//   <ng-template ng-option-tmp let-item="item" let-search="searchTerm" let-index="index">
//     <span >{{ item.client_name + '-' +item.job_title }}</span>
//   </ng-template>
// </ng-select>