import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { constants } from 'buffer';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { UserDetailComponent } from '../user-detail/user-detail.component';
import { User } from './../../../../models/user';

const _NgbModalOptions: NgbModalOptions = {
  backdrop: 'static',
  centered: true,
  keyboard: false,
  size: 'lg'
}


@Component({
  selector: 'app-users-inline',
  template: `
    <div class="form-row">
      <div class="col form-group">
        <div class="form-row">
          <div class="col">
          <ng-select #select *ngIf="actionName===constants.SUBMISSION || actionName===constants.ASSIGNMENT" [items]="collection" [searchable]="false" [disabled]="isDisabled" [(ngModel)]="item"
          (ngModelChange)="change($event);" bindLabel="first_name" bindValue="id"  #_item="ngModel"
          [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }" [placeholder]="'Select the default assignee'">
          <ng-template ng-header-tmp>
            <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)" />
          </ng-template>
          <ng-template ng-label-tmp let-item="item">
            <span >{{ item.first_name ? item.first_name :'' }} {{ item.last_name ? item.last_name  :'' }}</span>
          </ng-template>
          <ng-template ng-option-tmp let-item="item" let-search="searchTerm" let-index="index">
            <span >{{ item.first_name ? item.first_name :'' }} {{ item.last_name ? item.last_name  :'' }}</span>
          </ng-template>
        </ng-select>
        


            <ng-select #select *ngIf="actionName!==constants.SUBMISSION && actionName!==constants.ASSIGNMENT" [items]="collection" [searchable]="false" [(ngModel)]="item"
              (ngModelChange)="change($event);" bindLabel="first_name" bindValue="id" required #_item="ngModel" [placeholder]="'Select the default assignee'"
              [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }" required>
              <ng-template ng-header-tmp>
                <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)" />
              </ng-template>
              <ng-template ng-label-tmp let-item="item">
                <span >{{ item?.first_name + ' ' + item?.last_name }}</span>
              </ng-template>
              <ng-template ng-option-tmp let-item="item" let-search="searchTerm" let-index="index">
                <span >{{ item?.first_name + ' ' + item?.last_name }}</span>
              </ng-template>
            </ng-select>
          </div>
          <div class="col-auto" *ngIf="actionName!==constants.ASSIGNMENT">
            <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom"
              title="Add Another User" [disabled]="selectedElement" (click)="openCreateModal()">
              <i class="fas fa-plus-square"></i>
            </button>
          </div>
          <div class="col-auto" *ngIf="actionName!==constants.ASSIGNMENT">
            <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom"
              title="Change Selected User" [disabled]="!selectedElement" (click)="openEditModal()">
              <i class="fas fa-highlighter text-light"></i>
            </button>
          </div>
          <div class="col-auto" *ngIf="actionName!==constants.ASSIGNMENT">
            <button type="button" class="btn btn-danger" data-tooltip="tooltip" data-placement="bottom"
              title="Delete Selected User" [disabled]="!selectedElement" (click)="openDeleteModal()">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>         
  `,
  styles: [
  ]



})
export class UsersInlineComponent extends Paging<User> implements OnInit, OnDestroy {
  constants = Constants;
  api_path = APIPath.GET_USER_DROPDOWN_LIST;
  selectedElement: string;
  @Input() actionName: string;
  constructor(
    _api: APIProviderService<User>,
    _selectAll: SelectAllService,
    private modalService: NgbModal
  ) { super(_api, _selectAll); }

  @Input() item: any;
  @Input() isDisabled: boolean = false;
  @Output() changeItemEvt = new EventEmitter<string>();
  @Output() changeEmailEvt = new EventEmitter<string>();
  private getSub: Subscription;
  collection: any;

  ngOnInit(): void {
    console.log("ngOnInit");
    console.log(this.item);
    console.log(this.isDisabled);
    this.getList();
    // if (!this.item && this.actionName === Constants.JD)
    //   this.changeItemEvt.emit(Constants.DEFAULT_MANAGER)
  }

  ngOnDestroy(): void {
    // if (this.getSub) this.getSub.unsubscribe();

  }

  getList(): void {
    // this.fetchCollectionListForDropDowns(this.api_path + `?ordering=-created_at&offset=0&limit=50`);
    this._api.getListAPI(this.api_path + `?ordering=-created_at&offset=0&limit=50`).subscribe((res) => {
      this.collection = res;
      console.log("this.item1");
      console.log(this.item);
      console.log(this.isDisabled);
      // if(this.item && !this.isDisabled){
      //   this.isDisabled = true;
      // }
      // if (this.item && this.item!==null && this.item!==undefined && this.item!=='undefined' && !this.isDisabled ) {
      //   for (let i = 0; i < this.collection.length; i++) {
         
      //     if (this.collection[i].id.replace(/-/g, "") === this.item) {
      //        this.item = this.collection[i].id;  
             
      //        this.isDisabled = true;
            
      //        break;
            
      //       }
      //   }
      // }else{
      //   this.item = null
      //   // this.isDisabled = false;
      // }

      console.log("this.item");
      console.log(this.item);
      console.log(this.isDisabled);
      console.log("this.item");
     
    }, error => {
      console.log(error);
    })
  }


  change(event): void {
    console.log(event);
    this.selectedElement = event;
    this.emitEmailChange(event);
    this.emitChange(event);
  }

  emitEmailChange(event): void {
    console.log(event);
    var email;
    this.collection.forEach(item => { if (item.id === event) { email = item.email; } })
    this.changeEmailEvt.emit(email);
  }

  emitChange(event): void {
    this.changeItemEvt.emit(event);
  }


  openCreateModal(): void {
    const modalRef = this.modalService.open(UserDetailComponent, _NgbModalOptions);
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {
      this.item = this.selectedElement = res.id;
      this.getList();
    });
  }

  openEditModal(): void {
    const modalRef = this.modalService.open(UserDetailComponent, _NgbModalOptions);
    modalRef.componentInstance.eventId = Constants.EDIT_POP_UP;
    modalRef.componentInstance.indexAsInput = this.selectedElement;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => this.getList());
  }

  openDeleteModal(): void {
    _NgbModalOptions.size = 'sm';
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    const element: User = this.collection.filter(l => l.id === this.selectedElement)[0];
    modalRef.componentInstance.id = this.selectedElement;
    modalRef.componentInstance.name = `${element.first_name} ${element.last_name}`;
    modalRef.componentInstance.title = Constants.USER;
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }




}


// <ng-select #select *ngIf="actionName===constants.SUBMISSION || actionName===constants.ASSIGNMENT" [items]="collection|submission" [searchable]="false" [(ngModel)]="item"
// (ngModelChange)="change($event);" bindLabel="first_name" bindValue="id"  #_item="ngModel"
// [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }" >
// <ng-template ng-header-tmp>
//   <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)" />
// </ng-template>
// <ng-template ng-label-tmp let-item="item">
//   <span >{{ item.first_name + ' ' + item.last_name }}</span>
// </ng-template>
// <ng-template ng-option-tmp let-item="item" let-search="searchTerm" let-index="index">
//   <span >{{ item.first_name + ' ' + item.last_name }}</span>
// </ng-template>
// </ng-select>
