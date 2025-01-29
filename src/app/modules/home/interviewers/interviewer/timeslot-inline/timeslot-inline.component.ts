import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { TimeSlot } from 'src/app/models/timeslot';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
@Component({
  selector: 'app-timeslot-inline',
  template: `<div class="form-row">
  <div class="col form-group">
   
    <div class="form-row">
      <div class="col">
        <ng-select #select [items]="collection" [searchable]="false" [(ngModel)]="item" (ngModelChange)="change($event);" 
        bindLabel="time_slot" bindValue="id" required 
        #_item="ngModel" [ngClass]="{ 'is-invalid':_item.invalid && _item.touched }">
        <ng-template ng-header-tmp>
        <input style="width: 100%; line-height: 24px" type="text" (input)="select.filter($event.target.value)"/>
        </ng-template>
        </ng-select>
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
     _selectAll:SelectAllService
    //private modalService: NgbModal
  ) { 
    super(_api,_selectAll);
  }

  @Input() item: number;
  @Output() changeItemEvt = new EventEmitter<number>();
//@Output() changeEmailEvt = new EventEmitter<string>();
  private getSub: Subscription;
  
  selectedElement: number;


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


  change(event): void {
      console.log(event +"change")
    //this.selectedElement = event;
   // this.emitEmailChange(event);
    this.emitChange(event);
    
  }

//   emitEmailChange(event):void{
//       console.log(event);
//       var email;
//       this.collection.forEach(item=>{if(item.id===event){ email=item.email; console.log(email)}})
//     this.changeEmailEvt.emit(email);
//   }

  emitChange(event): void {
    this.changeItemEvt.emit(event);
  }

}
