import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Source } from 'src/app/models/interviews';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { AddSourceComponent } from '../add-source/add-source.component';
@Component({
  selector: 'app-source-inline',
  template: `<div class="form-row">
  <div class="col form-group">
   
    <div class="form-row">
      <div class="col">
        <ng-select #select [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
        bindLabel="source" bindValue="id" required 
        #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
        <ng-template ng-header-tmp>
        <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)"/>
        </ng-template>
        </ng-select>
      </div>
      <div class="col-auto">
      <button type="button" class="btn btn-primary" data-tooltip="tooltip" data-placement="bottom" title="Add Another Interview Mode" 
      [disabled]="selectedElement" (click)="openCreateModal()">
        <i class="fas fa-plus-square"></i>
      </button>
    </div>
    <div class="col-auto">
      <button type="button" class="btn btn-warning" data-tooltip="tooltip" data-placement="bottom" title="Change Selected Interview Mode" 
      [disabled]="!selectedElement" (click)="openEditModal()">
        <i class="fas fa-highlighter text-light"></i>
      </button>
    </div>
    <div class="col-auto">
      <button type="button" class="btn btn-danger" data-tooltip="tooltip" data-placement="bottom" title="Delete Selected Interview Mode" 
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
export class SourceInlineComponent extends Paging<Source> { 
    api_path = APIPath.SOURCE;
  constructor(
     _api: APIProviderService<Source>,
     _selectAll:SelectAllService,
     private modalService: NgbModal
  ) { 
    super(_api,_selectAll);
  }

  @Input() item: number;
  @Output() changeItemEvt = new EventEmitter<String>();
  @Output() changeItemCustom = new EventEmitter<boolean>();
  
  selectedElement: any;
  manual_invite:String


  ngOnInit(): void {
      console.log(this.api_path+ " api path")
    this.getList();
  }

  ngOnDestroy(): void {
   // if (this.getSub) this.getSub.unsubscribe();
   
  }

  getList(): void {
    this.fetchCollectionList();
  }


  saveInvite(event){
    this.changeItemCustom.emit(event);
  }

  change(event): void {
    console.log(event);
    
    this.selectedElement = event;
    if(event === "8131c1d3-d43d-4e91-94ec-276f4fadc059" || event === "fda8f50d-e6f5-4622-bba0-edd19e4ef6af"){this.saveInvite(true);}else{this.saveInvite(false);}
  
    this.emitChange(event);
    
  }



  emitChange(event): void {
    this.changeItemEvt.emit(event);
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(AddSourceComponent, {
      backdrop:'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.POP_UP;
    modalRef.componentInstance.indexAsInput = undefined;
    modalRef.componentInstance.isPopup = true;
    // modalRef.result.then(res => {
    //   this.item = this.selectedElement = res.id;
    //   this.getList();
    // });
    modalRef.componentInstance.refreshListEvt.subscribe((res) => {
      this.item = this.selectedElement = res.id;
      this.emitChange(this.item);
      this.fetchCollectionList();
      });
  }

  openEditModal(): void {
    const modalRef = this.modalService.open(AddSourceComponent, {
      backdrop:'static',
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.eventId = Constants.EDIT_POP_UP;
    modalRef.componentInstance.indexAsInput = this.selectedElement;
    modalRef.componentInstance.isPopup = true;
    modalRef.componentInstance.refreshListEvt.subscribe((res) => {
      this.item = this.selectedElement = res.id;
      this.emitChange(this.item);
      this.fetchCollectionList();
      });
    //modalRef.result.then(res => this.getList());
  }

  openDeleteModal(): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    // modalRef.componentInstance.client = this.collection.filter(l => l.id === this.selectedElement)[0];
    // modalRef.result.then(res => {
    //   if (res.result) {
    //     this.deleteCollectionItem(res.id);
    //   }
    // });
    modalRef.componentInstance.title = Constants.SOURCE;
    modalRef.componentInstance.id=this.selectedElement;
    modalRef.result.then(res => {
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
