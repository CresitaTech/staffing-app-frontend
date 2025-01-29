import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Source } from 'src/app/models/interviews';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-add-source',
  templateUrl: './add-source.component.html',
  styleUrls: ['./add-source.component.scss']
})
export class AddSourceComponent implements OnInit {

  @Output() refreshListEvt = new EventEmitter<any>();
  @Output() closeAddForm = new EventEmitter<any>();

  @Input() indexAsInput:string;
  @Input() eventId:string;
  @Input() candidate_name;
  @Input() candidate_id;
  source={} as Source;
  @ViewChild('closebutton') closebutton;
  constants=Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;


  constructor(
    private _api:APIProviderService<Source>,
    public activeModal: NgbActiveModal,
  ) { 

  }

  ngOnInit(): void {
    if(this.indexAsInput!=undefined)
    this.getSourceById(this.indexAsInput);
  }

  ngOnChanges(): void {
    if(this.indexAsInput!=undefined)
    this.getSourceById(this.indexAsInput);
  }


  getSourceById(index:string){
    this._api.getCollectionItemById(APIPath.SOURCE,index).subscribe((res)=>{
      this.source=res;
    }, error=>{
      console.log(error);
      
})
  }

  onEdit(){
    
    this.subscription2$=this._api.putCollectionItemById
    (APIPath.SOURCE,this.indexAsInput, this.source).subscribe((res)=>{
    // console.log(res);
   this.refreshOnModifyOrAdd(res);
  }, error=>{
    console.log(error);
    
})
    }

  onSubmit(){
    this.subscription1$ = this._api.createCollectionItem(APIPath.SOURCE,this.source)
      .subscribe((res: any) => {
        // console.log(res);
        this.refreshOnModifyOrAdd(res);
      } , error=>{
            console.log(error);
            
      });
      
  }

  closeAddInterviewMode(){
      document.getElementById("addInterviewMode").style.width = "0";
  
   // this.closeAddForm.emit(null);
   //console.log("Hey")
  }

  refreshOnModifyOrAdd(res:any){
    this.source={} as Source;
     //window.location.reload();
    this.refreshListEvt.emit(res);
    if(this.eventId===this.constants.POP_UP || this.eventId===this.constants.EDIT_POP_UP){
      this.closebutton.nativeElement.click();
    }
  }

}
