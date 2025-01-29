import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { constants } from 'buffer';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Candidate } from 'src/app/models/candidate';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { AddCandidateComponent } from '../add-candidate/add-candidate.component';
import { CandidateDeleteComponent } from '../candidate-delete/candidate-delete.component';

@Component({
  selector: 'app-candidate-inline',
  template: `
  <div class="form-row candidate-name">
    <div class="col">
      <label class="asterisk-if-mandatory">Candidate Name</label>
      <div class="form-row">
        <div class="col">
        

        <ng-select [disabled]="disabled" #select [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
        bindLabel="first_name" bindValue="id" required 
        #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
          <ng-template ng-header-tmp>
            <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)"/>
          </ng-template>
          <ng-template ng-label-tmp let-item="item">
            <span >{{ item.first_name + ' ' + item.last_name }}</span>
          </ng-template>
          <ng-template ng-option-tmp let-item="item" let-search="searchTerm" let-index="index">
            <span >{{ item.first_name + ' ' + item.last_name }}</span>
          </ng-template>
        </ng-select>

        </div>
        <div class="col-auto" *ngIf="!disabled">
          <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom" title="Add Another Candidate" 
          [disabled]="selectedElement" (click)="openCreateModal()">
            <i class="fas fa-plus-square"></i>
          </button>
        </div>
        <div class="col-auto" *ngIf="!disabled">
          <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom" title="Change Selected Candidate" 
          [disabled]="!selectedElement" (click)="openEditModal()">
            <i class="fas fa-highlighter text-light"></i>
          </button>
        </div>
        <div class="col-auto" *ngIf="!disabled">
          <button type="button" class="btn btn-danger" data-tooltip="tooltip" data-placement="bottom" title="Delete Selected Client" 
          [disabled]="!selectedElement" (click)="openDeleteModal()">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </div>
    </div>  
  </div>         
`
  , styles: [
  ]
})
export class CandidateInlineComponent extends Paging<Candidate> {
  api_path = APIPath.GET_CANDIDATE_DROPDOWN;
  @Input() jobid:string;
  @Input() eventId: string;
  @Input() actionName:string;
  @Input() itemId: string;
  @Input() item: string;
  @Input() disabled: boolean  = false;
  @Output() changeItemEvt = new EventEmitter<number>();
  @Output() getResumeEvt = new EventEmitter<string>();
  @Output() getAllDetails = new EventEmitter<any>();

  const = Constants;
  private getSub: Subscription;
  private deleteSub: Subscription;
  selectedElement: string;
  collectionNew: Candidate[];
  resume: string;
 
  

  constructor(
    _api: APIProviderService<Candidate>,
    _selectAll: SelectAllService,
    private modalService: NgbModal
  ) {
    super(_api, _selectAll);
     if (this.item != null) {
          //  this.selectedElement=this.itemId;  
          this.emitChange(this.item);
      }
      console.log('------------------------------------10')

  }

  ngOnInit(): void {
    console.log('------------------------------------11')
    console.log(this.itemId)
    console.log(this.item)
    this.getList();
  
  }

  ngAfterViewInit(){
   
  }

  ngOnDestroy(): void {
    if (this.getSub) this.getSub.unsubscribe();
    if (this.deleteSub) this.deleteSub.unsubscribe();
  }

  getList(): void {
    if (this.actionName === this.const.SUBMISSION) {
      this.fetchCollectionListForDropDowns(APIPath.GET_SUBMISSION_CANDIDATES);
    }
    else {
      this.fetchCollectionListForDropDowns(this.api_path + '?ordering=-created_at&offset=0');
    }
  }


  //USE IT FOR SUBMISSION IF REQUIRED
  // sendObjectOnchange(event){
  //   this.collection.forEach(x=>
  //     {if(x.id===event) 
  //       this.resume= x.resume;
  //       console.log("resume "+ this.resume );
  //     })
  //     this.getResumeEvt.emit(this.resume);
  //     this.emitChange(event);
  // }

  change(event): void {
    console.log(event);
    this.selectedElement = event;
    this.emitChange(event);
  }

  emitChange(event): void {
    this.changeItemEvt.emit(event);
    this.collection.filter((_)=>{
      if(_.id===event)  this.getAllDetails.emit(_);
    })
  
  }

  

  openCreateModal(): void {
    const modalRef = this.modalService.open(AddCandidateComponent, {
      backdrop:'static',
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

  openEditModal(): void {
    const modalRef = this.modalService.open(AddCandidateComponent, {
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
    AddCandidateComponent
    const modalRef = this.modalService.open(CandidateDeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.designation = this.collection.filter(l => l.id === this.selectedElement)[0];
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }

}
