import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Designation } from 'src/app/models/designation';
import { InlineComponent } from 'src/app/models/inline-component';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { DesignationService } from 'src/app/services/designation/designation.service';
import { DesignationDeleteComponent } from '../designation-delete/designation-delete.component';
import { DesignationDetailComponent } from '../designation-detail/designation-detail.component';

@Component({
  selector: 'app-designation-inline',
  template: `
    <div class="form-row">
      <div class="col form-group">
        <label class="asterisk-if-mandatory">Designation</label>
        <div class="form-row">
          <div class="col">
            <ng-select #select [items]="collection" [searchable]="false" [(ngModel)]="item"  (ngModelChange)="change($event);" bindLabel="name" bindValue="id">
              <ng-template ng-header-tmp>
                <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)" />
              </ng-template>
            </ng-select>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom" title="Add Another Designation"  (click)="openCreateModal()">
              <i class="fas fa-plus-square"></i>
            </button>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom" title="Change Selected Designation" [disabled]="!selectedElement" (click)="openEditModal()">
            <i class="fas fa-highlighter text-light"></i>
          </button>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-danger" data-tooltip="tooltip" data-placement="bottom" title="Delete Selected Designation" [disabled]="!selectedElement" (click)="openDeleteModal()">
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
export class DesignationInlineComponent extends Paging<Designation> implements OnInit, OnDestroy, InlineComponent {
  api_path = APIPath.DESIGNATION;

  @Input() item: number;
  @Output() changeItemEvt = new EventEmitter<number>();

  list: Array<any>;
  selectedElement: number;

  constructor(
    // private designationService: DesignationService,
    private modalService: NgbModal,
    _api: APIProviderService<Designation>,
    _selectAll: SelectAllService
  ) {
    super(_api, _selectAll)
  }

  ngOnInit(): void {
    // this.getList();
    //this.fetchCollectionList();
    this.fetchCollectionListWithExactAPI(this.api_path + '?ordering=-created_at&offset=0');

  }

  ngOnDestroy(): void {
    this.unsubscribeDeleteSub();
    if (this.fetchSub) this.fetchSub.unsubscribe();
  }

  change(event): void {
    this.selectedElement = event;
    this.emitChange(event);
  }

  emitChange(event): void{
   // console.log(event);
    this.changeItemEvt.emit(event);
  }


  /**
   * openCreateCandidateModal
   */
  openCreateModal(){
    const modalRef = this.modalService.open(DesignationDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.ADD;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {
    //  console.log(res)
      this.item = this.selectedElement = res.id;
      this.emitChange(this.item );
      this.fetchCollectionListWithExactAPI(this.api_path + '?ordering=-created_at&offset=0');
    },error=>{
      console.log(error);
    });
  }

  openEditModal(){
    const modalRef = this.modalService.open(DesignationDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.EDIT;
    modalRef.componentInstance.indexAsInput = this.selectedElement;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {
      this.item = this.selectedElement = res.id;
      this.fetchCollectionListWithExactAPI(this.api_path + '?ordering=-created_at&offset=0');
    },error=>{
      console.log(error);
    }
      );
  }

  openDeleteModal(){
    const modalRef = this.modalService.open(DesignationDeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    //console.log(this.selectedElement)
    modalRef.componentInstance.designation=this.selectedElement;
    //modalRef.componentInstance.designation = this.list.filter(l => l.id === this.selectedElement)[0];
    modalRef.result.then(res => {
    //  console.log(res);
      if (res.result) {
        this.deleteItem(res.id);
      }
    },error=>{
      console.log(error);
    });
  }


  deleteItem(id: string) {
    this.deleteCollectionItemForExactAPI(this.api_path + '?ordering=-created_at&offset=0',id);
    this.item=null;
    this.emitChange(this.item);
  }

}
