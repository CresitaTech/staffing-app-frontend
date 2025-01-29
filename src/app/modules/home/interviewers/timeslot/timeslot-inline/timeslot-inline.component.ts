import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { TimeSlot } from 'src/app/models/timeslot';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { AddTimeslotComponent } from '../add-timeslot/add-timeslot.component';
@Component({
  selector: 'app-timeslott-inline',
  template: `<div class="form-row">
  <div class="col form-group">
   
    <div class="form-row">
      <div class="col">
        <ng-select #selectSlot [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
        bindLabel="time_slot" [bindValue]="!isMultipleSelect ? 'id' :''" ng-required="!isMultipleSelect" 
        #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
        <ng-template ng-header-tmp>
        <input style="width: 100%; line-height: 24px" type="text" (input)="selectSlot.filter($event.target.value)"/>
        </ng-template>
        </ng-select>
        </div>
        <div class="col-auto">
        <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom" title="Add Another TimeSlot" 
        [disabled]="selectedElement" (click)="openCreateModal()">
          <i class="fas fa-plus-square"></i>
        </button>
      </div>
      <div class="col-auto">
        <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom" title="Change Selected TimeSlot" 
        [disabled]="!selectedElement" (click)="openEditModal()">
          <i class="fas fa-highlighter text-light"></i>
        </button>
      </div>
      <div class="col-auto">
        <button type="button" class="btn btn-danger" data-tooltip="tooltip" data-placement="bottom" title="Delete Selected TimeSlot" 
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
export class TimeslotInlineComponent extends Paging<TimeSlot> {
  api_path = APIPath.TIMESLOT;
  constructor(
    _api: APIProviderService<TimeSlot>,
    _selectAll: SelectAllService,
    private modalService: NgbModal
  ) {
    super(_api, _selectAll);
  }

  @Input() item: any;
  @Input() isMultipleSelect = false;
  @Output() changeItemEvt = new EventEmitter<any>();
  @Output() changeItemsEvt = new EventEmitter<any>();
  @ViewChild('selectSlot') ngSelectComponent: NgSelectComponent;
  selectedElement: any;


  ngOnInit(): void {
    // this.selectedElements = this.items;
    console.log(this.api_path + " api path")
    this.getList();
  }

  ngOnDestroy(): void {

  }

  getList(): void {
    this._api.getListAPI(this.api_path + '?ordering=-created_at&offset=0').subscribe((res: any) => {

      if (res) {

        this.collection = res.results;
        var timeSlot = {} as TimeSlot;
        timeSlot.time_slot = "Manual";
        if (!this.isMultipleSelect) {
          this.collection.push(timeSlot);
        }
      }



    }, error => {
      console.log(error);

    })


    // this.fetchCollectionList();
  }


  change(event): void {
    this.selectedElement = event;


    this.emitChange(event);
  }

  emitChange(event): void {

    if (this.isMultipleSelect) {
      setTimeout(() => {
        this.ngSelectComponent.clearModel();
      })

      this.changeItemsEvt.emit(event);
    } else {
      console.log(event);
      if (event != null) {
        this.changeItemEvt.emit(event);
      } else {
        this.openCreateModal();
      }
    }
  }


  openCreateModal(): void {
    const modalRef = this.modalService.open(AddTimeslotComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    /*modalRef.result.then(res => {
      this.item = this.selectedElement = res.id;
      this.emitChange(this.item);
      //this.fetchCollectionListWithExactAPI(this.api_path + '?ordering=-created_at&offset=0');
      this.fetchCollectionList();
      //this.item = this.selectedElement = res.id;
      //this.getList();
    });*/
    modalRef.componentInstance.refreshListEvt.subscribe((res) => {
      if (!this.isMultipleSelect) {
        this.item = this.selectedElement = res.id;
        this.changeItemEvt.emit(this.item);
      } else {
        this.item = this.selectedElement = res;
        this.changeItemsEvt.emit(this.item);
      }
      this.emitChange(this.item);
      this.getList();
    });
  }

  openEditModal(): void {
    const modalRef = this.modalService.open(AddTimeslotComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.EDIT_POP_UP;
    modalRef.componentInstance.indexAsInput = this.selectedElement.id;
    modalRef.componentInstance.isPopup = true;
    //  modalRef.result.then(res => this.getList());
    modalRef.componentInstance.refreshListEvt.subscribe((res) => {
      if (!this.isMultipleSelect) {
        this.item = this.selectedElement = res.id;
      } else {
        this.item = this.selectedElement = res;
      }
      this.emitChange(this.item);
      this.getList();
    });
  }

  openDeleteModal(): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });

    modalRef.componentInstance.title = Constants.TIMESLOT;
    modalRef.componentInstance.id = this.selectedElement.id;
    modalRef.componentInstance.name = this.selectedElement.time_slot;
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteItem(res.id);
      }
    }, error => {
      console.log(error);
    });

  }

  deleteItem(id: string) {
    this.deleteCollectionItemForExactAPI(this.api_path + '?ordering=-created_at&offset=0', id);
    this.item = null;
    this.emitChange(this.item);
  }



}
