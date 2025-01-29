import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Interviewer } from 'src/app/models/interviewer';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { CustomValidatorService } from 'src/app/services/common/custom-validator.service';

@Component({
  selector: 'app-add-interviewer',
  templateUrl: './add-interviewer.component.html',
  styleUrls: ['./add-interviewer.component.scss']
})
export class AddInterviewerComponent implements OnInit {

  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;
  interviewer = {} as Interviewer;
  constants = Constants;
  subscription2$: Subscription;
  subscription1$: Subscription;
  @ViewChild('closebutton') closebutton;
  @ViewChild("inp") inp: HTMLInputElement;
  @Output() closeAddEditPage = new EventEmitter<any>();


  constructor(
    private service: APIProviderService<Interviewer>,
    public  activeModal:NgbActiveModal,
    public customValidator :CustomValidatorService

  ) {
  }

  ngOnInit(): void {
    if (this.indexAsInput != undefined)
    this.getInterviewerById(this.indexAsInput);
  }

  ngOnChanges(): void {
    if (this.indexAsInput != undefined)
      this.getInterviewerById(this.indexAsInput);

  }


  getInterviewerById(index: string) {
    this.service.getCollectionItemById(APIPath.INTERVIEWER, index).subscribe((res) => {
      this.interviewer = res;
    }, error => {
      console.log(error);

    })
  }

  addTimeSlot(event): void {
   console.log("addTimeSlot");
   console.log(event);
   
    var found = false;
    if(this.interviewer.time_slots){
    this.interviewer.time_slots.forEach(slot =>{

     
      if(slot.time_slot === event.time_slot){
        found = true;
      }
    });
  }else{
    this.interviewer.time_slots = [];
  }
    if(!found){
      this.interviewer.time_slots.push(event);
    }
   
  }


  onEdit() {
    this.subscription2$ = this.service.putCollectionItemById
      (APIPath.INTERVIEWER, this.indexAsInput, this.interviewer).subscribe((res) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);

      })
  }

  removeSlot(slot){
    this.interviewer.time_slots.forEach((item, index) => {
      if (item.time_slot === slot) this.interviewer.time_slots.splice(index, 1);
    });
   
  }


  onSubmit() {
    console.log(this.interviewer)
    this.subscription1$ = this.service.createCollectionItem(APIPath.INTERVIEWER, this.interviewer)
      .subscribe((res: any) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);

      });

  }

  refreshOnModifyOrAdd() {
    this.interviewer = {} as Interviewer
    this.refreshListEvt.emit(null);
    if(this.eventId===this.constants.POP_UP || this.eventId===this.constants.EDIT_POP_UP){
      this.closebutton.nativeElement.click();
    }
  }

  phoneNumberRef(event, element: HTMLInputElement, form: NgForm){
    this.customValidator.phoneNumberFormat(event, element,form);
   }
 
   preventEnter(event, formController) {
     this.customValidator.preventEnter(event, formController);
   }

   closeInterviewer(){
    this.closeAddEditPage.emit(null);
    }

}
