import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Group } from 'src/app/models/group';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { GroupDetailComponent } from '../group-detail/group-detail.component';

const _NgbModalOptions: NgbModalOptions = {
  backdrop: 'static',
  centered: true,
  keyboard: false,
  size: 'lg'
}

@Component({
  selector: 'app-group-inline',
  template: `
    <div class="form-row">
      <div class="col form-group">
        <label class="asterisk-if-mandatory">Group Name</label>
        <div class="form-row">
          <div class="col">
        
          <ng-select #select [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
          bindLabel="first_name" bindValue="id" required 
          #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
            <ng-template ng-header-tmp>
              <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)"/>
            </ng-template>
          </ng-select>

          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom" title="Add Another Candidate" 
            [disabled]="selectedElement" (click)="openCreateModal()">
              <i class="fas fa-plus-square"></i>
            </button>
          </div>
          <div class="col-auto">
            <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom" title="Change Selected Candidate" 
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
  styles: [``]
})
export class GroupInlineComponent extends Paging<Group> implements OnInit, OnDestroy {

  api_path = APIPath.USERS;
  
  @Input() item: number;
  @Output() changeItemEvt = new EventEmitter<number>();

  constants = Constants;

  private getSub: Subscription;
  private deleteSub: Subscription;

  selectedElement: number;

  collectionNew: Group[];

  constructor(
    _api: APIProviderService<Group>,
    _selectAll: SelectAllService,
    private modalService: NgbModal
  ) {
    super(_api, _selectAll);
  }

  ngOnInit(): void {
    this.fetchCollectionList();
  }

  ngOnDestroy(): void {
    if (this.getSub) this.getSub.unsubscribe();
    if (this.deleteSub) this.deleteSub.unsubscribe();
  }


  change(event): void {
    this.selectedElement = event;
    this.emitChange(event);
  }

  emitChange(event): void {
    this.changeItemEvt.emit(event);
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(GroupDetailComponent, _NgbModalOptions);
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => {
      this.item = this.selectedElement = res.id;
      this.fetchCollectionList();
    });
  }

  openEditModal(): void {
    const modalRef = this.modalService.open(GroupDetailComponent, _NgbModalOptions);
    modalRef.componentInstance.eventId = Constants.EDIT_POP_UP;
    modalRef.componentInstance.indexAsInput = this.selectedElement;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => this.fetchCollectionList());
  }

  openDeleteModal(): void {
    _NgbModalOptions.size = 'sm';
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    const element = this.collection.filter(l => l.id === this.selectedElement)[0];
    modalRef.componentInstance.id = this.selectedElement;
    modalRef.componentInstance.name = element.name;
    modalRef.componentInstance.title = Constants.GROUP;
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }

}
