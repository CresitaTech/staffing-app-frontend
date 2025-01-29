import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { CustomDateAdapter } from 'src/app/classes/CustomDateAdapter/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/classes/CustomDateParserFormatter/custom-date-parser-formatter';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { PlacementCard } from 'src/app/models/placement-card';
import { APIProviderService } from 'src/app/services/api-provider.service';


@Component({
  selector: 'app-add-card',
  templateUrl: './add-card.component.html',
  styleUrls: ['./add-card.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ]
})
export class AddCardComponent  implements OnInit {
  @Input() candidate_name;
  @Input() candidate_id;
  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput:number;
  @Input() eventId:string;
  @ViewChild('closebutton') closebutton;
  card={} as PlacementCard;
  constants=Constants;
  subscription2$: Subscription;
  subscription1$: Subscription;
  @Input() job_description;

  constructor(
   private service:APIProviderService<PlacementCard> ,
   public activeModal: NgbActiveModal,
   private ngbCalendar: NgbCalendar,
   private dateAdapter: NgbDateAdapter<string>
  ) {
    this.card.remarks='';
    // this.card.candidate_name= this.candidate_name;
  }

  ngOnInit(): void {
    // console.log(this.candidate_name);
    if(this.eventId===Constants.POP_UP|| this.eventId===Constants.EDIT_POP_UP){
      if(this.job_description!==null ){
    this.card.client_name= this.job_description.client_name
      }
      if(this.candidate_name!==null){
        this.card.candidate_name= this.candidate_name;
      }
      // else{
      //   this.card.candidate_name= null;
      //   this.card.client_name= null;
      // }
    }
  }

  ngOnChanges(): void {

    if(this.indexAsInput!=undefined)
    this.getCardById(this.indexAsInput);

  }

  detailsOfSelectedCandidate(idx){
    this.service.getCollectionItemById(APIPath.CANDIDATE,idx.id).subscribe((evt)=>{
      this.card.client_name= evt.job_description.client_name
    })
  }

  getCardById(index:number){
    this.service.getCollectionItemById(APIPath.PLACEMENT, index).subscribe((res)=>{
      this.card=res;
    }, error=>{
      console.log(error);

})
  }


  onEdit(){
    this.subscription2$=this.service.putCollectionItemById
    (APIPath.PLACEMENT,this.indexAsInput, this.card).subscribe((res)=>{
    // console.log(res);
   this.refreshOnModifyOrAdd();
  }, error=>{
    console.log(error);
})
}



  onSubmit(){
    //console.log(this.card)
    if (this.card.candidate_name===this.candidate_name) {
      this.card.candidate_name=this.candidate_id;
    }
    this.subscription1$ = this.service.createCollectionItem(APIPath.PLACEMENT,this.card)
      .subscribe((res: any) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      } , error=>{
            console.log(error);
      });
  }

  refreshOnModifyOrAdd(){
    this.card={} as PlacementCard;
    this.refreshListEvt.emit(null);
    if(this.eventId===this.constants.POP_UP){
      this.closebutton.nativeElement.click();
    }
  }

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }


}
