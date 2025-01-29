import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbModal, NgbToastHeader } from '@ng-bootstrap/ng-bootstrap';
import { constants } from 'buffer';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { VendorTemplate } from 'src/app/models/vendor-template';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { AddVendorTempComponent } from '../add-vendor-temp/add-vendor-temp.component';

@Component({
  selector: 'app-vendor-temp-inline',
  template: `
    <div class="form-row">
      <div class="col form-group">
        <label class="asterisk-if-mandatory">Template Name</label>
        <div class="form-row">
          <div class="col">
            <ng-select #select  [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
            bindLabel="template_name" bindValue="id" required  name = "_item" (click) = "getList()"
            #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
              <ng-template ng-header-tmp>
                <input style="width: 100%; line-height: 24px" type="text"  class="form-control" (input)="select.filter($event.target.value)"/>
              </ng-template>
            </ng-select>
            <div
            *ngIf="_item.touched && _item.invalid"
            class="invalid-feedback"
            >
              <div *ngIf="_item.errors.required">
                Template name is required
              </div>
            </div>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom" title="Add Another Client" 
            [disabled]="selectedElement" (click)="openCreateModal()">
              <i class="fas fa-plus-square"></i>
            </button>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom" title="Change Selected Client" 
            [disabled]="!selectedElement" (click)="openEditModal()">
              <i class="fas fa-highlighter text-light"></i>
            </button>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-danger" data-tooltip="tooltip" data-placement="bottom" title="Delete Selected Client" 
            [disabled]="!selectedElement" (click)="openDeleteModal()">
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
export class VendorTempInlineComponent extends Paging<VendorTemplate> {

  api_path = APIPath.VENDOR_TEMPLATE;

  @Input() item: number;
  @Output() changeItemEvt = new EventEmitter<number>();
  @Output() refreshListEvt = new EventEmitter<any>();

  private getSub: Subscription;
  private deleteSub: Subscription;
  
  selectedElement: string;

  constructor(
    _api: APIProviderService<VendorTemplate>,
    _selectAll:SelectAllService,
    public modalService: NgbModal
  ) {
    super(_api, _selectAll)
   }

  ngOnInit(): void {
    this.getList();
  }

  ngOnDestroy(): void {
    if (this.getSub) this.getSub.unsubscribe();
    if (this.deleteSub) this.deleteSub.unsubscribe();
  }

  getList(): void {
   this.fetchCollectionList();
  }

  getCollection(): void{
    var button = document.getElementsByName('_item')[0];
    var handler = function () { this.getList() };
    button.addEventListener("click", handler, {once: true});
  }
   
  change(event): void {
    this.selectedElement = event;
    this.emitChange(event);
  }

  emitChange(event): void {
    this.changeItemEvt.emit(event);
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(AddVendorTempComponent, {
      backdrop:'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.ADD;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {
      this.item = this.selectedElement = res.id;
    });
  }

  openEditModal(): void {
    const modalRef = this.modalService.open(AddVendorTempComponent, {
      backdrop:'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.EDIT;
    modalRef.componentInstance.indexAsInput = this.selectedElement;
    modalRef.componentInstance.isPopup = true;
    //modalRef.dismiss(res => this.getList())
    modalRef.result.then(res => {
        this.getList();
    });
  }

  openDeleteModal(): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.title = Constants.EMAIL_TEMPLATE;
    modalRef.componentInstance.id = this.item;
    
    modalRef.componentInstance.client = this.collection.filter(l => l.id === this.selectedElement)[0];
    modalRef.result.then(res => {
      if (res.result) {
        this.getList();
        this.deleteCollectionItem(this.item.toString());
      }
    });
  }
}


