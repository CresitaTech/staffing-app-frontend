import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { TimeSlot } from 'src/app/models/timeslot';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-add-timeslot',
  templateUrl: './add-timeslot.component.html',
  styleUrls: ['./add-timeslot.component.scss']
})
export class AddTimeslotComponent implements OnInit {
  timeSlot={} as TimeSlot;
  eventId:String;
  constants=Constants;
  @ViewChild('closebutton') closebutton;
  indexAsInput: string;
  @Output() refreshListEvt = new EventEmitter<any>();


  constructor(
   private  _api:APIProviderService<TimeSlot>,
   public  activeModal:NgbActiveModal
  ) { }
  ngOnInit(): void {
    if(this.indexAsInput!=undefined)
    this.getTimeSlotById(this.indexAsInput);
  }


  ngOnChanges(): void {
    if(this.indexAsInput!=undefined)
    this.getTimeSlotById(this.indexAsInput);
  }


  getTimeSlotById(index:string){
    this._api.getCollectionItemById(APIPath.TIMESLOT,index).subscribe((res)=>{
      this.timeSlot=res;
    }, error=>{
      console.log(error);
      
})
  }

  onEdit(){
    this._api.putCollectionItemById
    (APIPath.TIMESLOT,this.indexAsInput, this.timeSlot).subscribe((res)=>{
    // console.log(res);
   this.refreshOnModifyOrAdd(res);
  }, error=>{
    console.log(error);
    
})
    }

  onSubmit(){
   this._api.createCollectionItem(APIPath.TIMESLOT,this.timeSlot)
      .subscribe((res: any) => {
        // console.log(res);
        this.refreshOnModifyOrAdd(res);
      } , error=>{
            console.log(error);
            
      });
      
  }


  refreshOnModifyOrAdd(res:any){
    this.timeSlot={} as TimeSlot;
     //window.location.reload();
    this.refreshListEvt.emit(res);
    if(this.eventId===this.constants.POP_UP || this.eventId===this.constants.EDIT_POP_UP){
      this.closebutton.nativeElement.click();
    }
  }



  // if(this.eventId===Constants.POP_UP){
  //   this.closebutton.nativeElement.click();
  // }

}
