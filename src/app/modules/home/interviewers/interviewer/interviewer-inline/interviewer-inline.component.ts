import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Interviewer } from 'src/app/models/interviewer';
import { Interview } from 'src/app/models/interviews';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { AddTimeslotComponent } from '../../timeslot/add-timeslot/add-timeslot.component';
import { AddInterviewerComponent } from '../add-interviewer/add-interviewer.component';

@Component({
  selector: 'app-interviewer-inline',
  template: `<div class="form-row">
  <div class="col">
   
    <div class="form-row">
      <div class="col">
        <ng-select #selectIntV [items]="collections" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
        bindLabel="first_name"  
        #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }" >
          <ng-template ng-header-tmp>
            <input style="width: 100%; line-height: 24px" type="text" (input)="selectIntV.filter($event.target.value)"/>
          </ng-template>
          <ng-template ng-label-tmp let-item="item">
            <span >{{ item.first_name + ' '}}{{item.last_name??item.primary_email}}</span>
          </ng-template>
          <ng-template ng-option-tmp let-item="item" let-search="searchTerm" let-index="index">
            <span >{{ item.first_name + ' '}}{{item.last_name??item.primary_email}}</span>
          </ng-template>
        </ng-select>
      </div>
      <div class="col-auto">
      <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom" title="Add Another Interviewer" 
      [disabled]="selectedElement" (click)="openCreateModal()">
        <i class="fas fa-plus-square"></i>
      </button>
    </div>

    </div>






    <div class="form-row mt-2" *ngIf="otherEmailShow">
    <div class="col" >
    <label class="asterisk-if-mandatory">Primary Email</label>
    <input type="email" class="form-control" placeholder="" id="primaryEmail"
        [(ngModel)]="selectedElement.primary_email" name="primaryEmail" #primaryEmail="ngModel"
        [ngClass]="{ 'is-invalid':primaryEmail.invalid && primaryEmail.touched }" [pattern]="constants.emailPattern"
        email />
    <div *ngIf="primaryEmail.invalid && primaryEmail.touched" class="invalid-feedback">
        <div *ngIf="primaryEmail.errors.required ">Primary Mail Id is required</div>
        <div *ngIf="primaryEmail.errors.pattern">Mail Id should be valid</div>
    </div>
    
</div>
<div class="col-auto">
      <button type="button" class="btn btn-primary mTop-28" data-tooltip="tooltip" data-placement="bottom" title="Add Another Interviewer" 
       (click)="onSubmit()">
        <i class="fas fa-plus-square"></i> Add interviewer
      </button>
    </div>
    </div>
    














  </div>  




</div>           
`,
  styles: [
  ]



})
export class InterviewerInlineComponent extends Paging<Interviewer> {
  api_path = APIPath.INTERVIEWER;
  constructor(
    
    _api: APIProviderService<Interviewer>,
    _selectAll: SelectAllService,
    private modalService: NgbModal

  ) {
    super(_api, _selectAll);
  }

  @Input() item: number;
  @Output() changeItemEvt = new EventEmitter<any>();
  @ViewChild('selectIntV') ngSelectComponent: NgSelectComponent;
  subscription1$: Subscription;

  selectedElement = {} as Interviewer;
  collections: Array<any> = [];
  constants = Constants;
  otherEmailShow = false;

  ngOnInit(): void {
    console.log(this.api_path + " api path")
    this.getList();
  }

  ngOnDestroy(): void {
    // if (this.getSub) this.getSub.unsubscribe();

  }

   validateEmail (email) {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  getList(): void {
    // this.fetchCollectionList();


    this._api.getListAPI(this.api_path + '?ordering=-created_at&offset=0').subscribe((res: any) => {

      if (res) {

        this.collections = res.results;
        var interviewer = {} as Interviewer;
        interviewer.first_name = "Other";
        interviewer.last_name = "";
        interviewer.primary_email = null;
        this.collections.push(interviewer);
      }



    }, error => {
      console.log(error);

    })


    //  this.fetchCollectionListWithExactAPI(this.api_path + '?ordering=-created_at&offset=0');

  }



  change(event): void {

    if (event) {
     

      console.log(event);
      if (event.first_name !== "Other" || event.primary_email) {
        this.emitChange(event);
        this.selectedElement = event;
      } else if(!event.primary_email){
        this.otherEmailShow = true;
        this.selectedElement.first_name = "Other";
      }

    }
    // console.log(this.selectedElement);

    if (this.selectedElement && (this.selectedElement.first_name !== "Other" || (this.selectedElement.first_name === "Other" && this.selectedElement.primary_email && this.selectedElement.primary_email !== null))) {
      this.selectedElement = {} as Interviewer;
      setTimeout(() => {
        this.ngSelectComponent.clearModel();
      })
    }
    // console.log(this.collections);
    // this.collections.forEach((item, index) => {
    //   if (item.primary_email) item.primary_email = null;
    // });



  }

  emitChange(event): void {
    this.changeItemEvt.emit(event);
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(AddInterviewerComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {
      this.item = this.selectedElement = res.id;
      this.getList();
    });
  }


  onSubmit() {
    if(!this.validateEmail(this.selectedElement.primary_email)){
      return;
    }
    console.log(this.selectedElement)
    this.subscription1$ = this._api.createCollectionItem(APIPath.INTERVIEWER, this.selectedElement)
      .subscribe((res: any) => {
        // console.log(res);
        this.changeItemEvt.emit(res);
        this.otherEmailShow = false;
        this.collections.push(res);
        this.selectedElement = {} as Interviewer;
      setTimeout(() => {
        this.ngSelectComponent.clearModel();
      })
      }, error => {
        console.log(error);

      });

  }

  openEditModal(): void {
    const modalRef = this.modalService.open(AddInterviewerComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.EDIT_POP_UP;
    modalRef.componentInstance.indexAsInput = this.selectedElement;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => this.getList());
  }

  openDeleteModal(): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.client = this.collection.filter(l => l.id === this.selectedElement)[0];
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }

}
