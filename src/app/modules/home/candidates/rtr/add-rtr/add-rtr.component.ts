import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Subscription } from 'rxjs';
import { Constants } from 'src/app/enums/constants.enum';
import { Rtr } from 'src/app/models/rtr';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { APIPath } from 'src/app/enums/api-path.enum';
import { CustomValidatorService } from 'src/app/services/common/custom-validator.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-rtr',
  templateUrl: './add-rtr.component.html',
  styleUrls: ['./add-rtr.component.scss']
})
export class AddRtrComponent implements OnInit {
  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput:string;
  @Input() eventId:string;
  @Input() candidate_name;
  @Input() candidate_full_name;
  @Input() candidate_id;
  @Input() primary_phone;
  @Input() primary_email;
  @Input() rate;
  @Input() salary;
  @Input() job_description;
  job_description_rtr=[];
  rtr={} as Rtr;
  @ViewChild('closebutton') closebutton;
  constants=Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;
  @ViewChild("inp") inp: HTMLInputElement;
  item:number;
 
  constructor(
    private _api:APIProviderService<Rtr>,
    public activeModal: NgbActiveModal,
    public customValidator:CustomValidatorService
  ) { 
  }

  ngOnInit(): void {
   this.job_description_rtr=this.job_description;
    console.log(this.candidate_id);
    if(this.indexAsInput!=undefined && this.eventId===Constants.EDIT)
    this.getRtrById(this.indexAsInput);

    
    if(this.eventId===Constants.POP_UP){
      this.rtr.email=this.primary_email;
      this.rtr.phone_no= this.primary_phone;
      this.rtr.candidate_name= this.candidate_id;
      this.rtr.consultant_full_legal_name= this.candidate_full_name;
      this.rtr.rate= this.rate?this.rate:this.salary;
     // console.log(this.job_description)

      this.rtr.job_id=null;
    }
  }

  
  detailsOfSelectedCandidate(idx){

    const request = [
      this._api.getCollectionItemById(APIPath.CANDIDATE,idx.id),
      this._api.getCollectionItemByCandidateId(APIPath.GET_CANDIDATE_JOB_STAGES, idx.id)
    ]
    forkJoin(request).subscribe((res: Array<any>) => {
      var evt = res[0];
      console.log(evt)
      var job_desc=res[1];
      this.job_description_rtr=[];
      this.rtr={} as Rtr;
      this.rtr.candidate_name= idx.id;
      this.rtr.email=evt.primary_email;
      this.rtr.phone_no= evt.primary_phone_number;
      this.rtr.consultant_full_legal_name= evt.first_name+" "+evt.last_name;

      if(evt.min_rate!==null && evt.max_rate!==null){
        this.rtr.rate=(evt.min_rate+"-"+evt.max_rate);
      }
      else if(evt.min_rate===null && evt.max_rate!==null){
        this.rtr.rate=evt.max_rate;
      }
      else if(evt.min_rate!==null && evt.max_rate===null){
        this.rtr.rate=evt.min_rate;
      }
      else{
      if(evt.min_salary!==null && evt.max_salary!==null){
        this.rtr.rate=(evt.min_salary+"-"+evt.max_salary); 
      }
      else if(evt.min_salary===null && evt.max_salary!==null){
        this.rtr.rate=evt.max_salary; 
      }
      else if(evt.min_salary!==null && evt.max_salary===null){
        this.rtr.rate=evt.min_salary; 
      }
      }
     job_desc.forEach(_ => {
        this.job_description_rtr.push(_.job_description);
      });

    },error=>{
      console.log(error);
      
    })   
  }

  ngOnChanges(): void {
    if(this.indexAsInput!=undefined && this.eventId===Constants.EDIT)
    this.getRtrById(this.indexAsInput);

    if(this.eventId===Constants.POP_UP){
      this.rtr.email=this.primary_email;
      this.rtr.phone_no= this.primary_phone;
      this.rtr.candidate_name= this.candidate_id;
      this.rtr.consultant_full_legal_name= this.candidate_full_name;
      this.rtr.rate= this.rate?this.rate:this.salary;
     // console.log(this.job_description)
     this.rtr.job_id=null;
      
    }
    
  }


  getRtrById(index:string){
    this._api.getCollectionItemById(APIPath.RTR,index).subscribe((res)=>{
      this.rtr=res;
      this.rtr.job_title=res.job_title;
      this.rtr.job_id=res.job_id
    }, error=>{
      console.log(error);
      
})
  }

  onEdit(){
    this.rtr.rtr_doc=null;
    this.subscription2$=this._api.putCollectionItemById
    (APIPath.RTR,this.indexAsInput, this.rtr).subscribe((res)=>{
    // console.log(res);
   this.refreshOnModifyOrAdd();
  }, error=>{
    console.log(error);
    
})
    }

  onSubmit(){
    console.log(this.rtr)
    this.subscription1$ = this._api.createCollectionItem(APIPath.RTR,this.rtr)
      .subscribe((res: any) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      } , error=>{
            console.log(error);
            
      });
      
  }

  refreshOnModifyOrAdd(){
    this.rtr={} as Rtr;
     //window.location.reload();
    this.refreshListEvt.emit(null);
    if(this.eventId===this.constants.POP_UP){
      this.closebutton.nativeElement.click();
    }
  }

  
  phoneNumberRef(event, element: HTMLInputElement, form: NgForm){
    this.customValidator.phoneNumberFormat(event, element,form);
   }
 
   preventEnter(event, formController) {
     this.customValidator.preventEnter(event, formController);
   }

   change(event): void {
     this.job_description_rtr.forEach(_ => {
        if(_.id===event)
        this.rtr.job_title=_.job_title;
     });
     this.rtr.job_id=event;
     console.log(event)
    // this.selectedElement = event;
    // this.emitChange(event);
  }

}
