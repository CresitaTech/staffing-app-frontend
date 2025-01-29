import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Roles } from 'src/app/enums/role.enum';
import { Client } from 'src/app/models/client';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { AddClientComponent } from '../add-client/add-client.component';
import { ClientDeleteComponent } from '../client-delete/client-delete.component';

@Component({
  selector: 'app-client-inline',
  template: `
    <div class="form-row">
      <div class="col form-group">
        <label class="asterisk-if-mandatory">Client Name</label>
        <div class="form-row">
          <div class="col">
            <ng-select #select [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
            bindLabel="company_name" bindValue="id" required 
            #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
              <ng-template ng-header-tmp>
                <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)"/>
              </ng-template>
            </ng-select>
          </div>
          <div class="col-auto"  *ngIf="presentRole!==role.RECRUITER">
            <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom" title="Add Another Client" 
            [disabled]="selectedElement" (click)="openCreateModal()">
              <i class="fas fa-plus-square"></i>
            </button>
          </div>
          <div class="col-auto"  *ngIf="presentRole!==role.RECRUITER">
            <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom" title="Change Selected Client" 
            [disabled]="!selectedElement" (click)="openEditModal()">
              <i class="fas fa-highlighter text-light"></i>
            </button>
          </div>
          <div class="col-auto"  *ngIf="presentRole!==role.RECRUITER">
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
export class ClientInlineComponent extends Paging<Client> {

  api_path = APIPath.CLIENT_DROPDOWN;

  @Input() item: number;
  @Output() changeItemEvt = new EventEmitter<number>();

  presentRole;
  role=Roles;

  private getSub: Subscription;
  private deleteSub: Subscription;
  
  selectedElement: string;

  constructor(
    _api: APIProviderService<Client>,
   private _selectAll:SelectAllService,
    private modalService: NgbModal,
    public auth:AuthService

  ) {
    super(_api, _selectAll)
   }

  ngOnInit(): void {
    this.getList();
    this.getRole();
  }

  ngOnDestroy(): void {
    if (this.getSub) this.getSub.unsubscribe();
    if (this.deleteSub) this.deleteSub.unsubscribe();
  }

  getList(): void {
  // this.fetchCollectionList();
  this.fetchCollectionListForDropDowns(this.api_path);


  }


  change(event): void {
    this.selectedElement = event;
    this._selectAll.setSelectedClientID(this.selectedElement);  ////sam
    this.emitChange(event);
  }

  emitChange(event): void {
    this.changeItemEvt.emit(event);
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(AddClientComponent, {
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
    const modalRef = this.modalService.open(AddClientComponent, {
      backdrop:'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.EDIT_POP_UP;
    modalRef.componentInstance.indexAsInput = this.selectedElement;
    modalRef.componentInstance.isPopup = true;
    modalRef.result.then(res => this.getList());
  }

  openDeleteModal(): void {
    const modalRef = this.modalService.open(ClientDeleteComponent, {
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


  getRole(): void {
    this.auth.getRole().subscribe((res: Roles) => {
      if (res) {
        this.presentRole = res;
      }
    })
}

}
