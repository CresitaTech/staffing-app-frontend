import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Mail } from 'src/app/models/mail';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-send-mail',
  templateUrl: './send-mail.component.html',
  styleUrls: ['./send-mail.component.scss']
})
export class SendMailComponent implements OnInit {
@Input() tagName;
@Input() mailAddress;
mailModel={} as Mail;
@ViewChild('closebutton') closebutton;
@Input() eventId;
constants=Constants;
  file: File;
  formData: any;

  @Output() refreshListEvt = new EventEmitter<any>();


  constructor(private service:APIProviderService<Mail>,
    public activeModal: NgbActiveModal) {
   
   }

  ngOnInit(): void {
   this.mailModel.email_to= this.mailAddress;
  // console.log("mailAddress" +this.mailAddress);
   this.mailModel.tag=this.tagName;

  }
  
  ngOnChanges():void{
    this.mailModel.email_to= this.mailAddress;
  //  console.log("mailAddress" +this.mailAddress);
    this.mailModel.tag=this.tagName;
  }


  onSubmit(){
    this.formData = new FormData();
    if(this.tagName===this.constants.CANDIDATE){
    this.formData.append('candidate_attachment', this.file);
    this.formData.append('email_to',this.mailAddress);
    this.formData.append("candidate_template",this.mailModel.candidate_template);
    this.formData.append("tag",this.constants.CANDIDATE)
    }
    else if(this.tagName===this.constants.VENDOR)
    {
    this.formData.append('vendor_attachment', this.file);
    this.formData.append('email_to',this.mailAddress);
    this.formData.append("vendor_template",this.mailModel.vendor_template);
    this.formData.append("tag",this.constants.VENDOR)
    }
    this.service.createCollectionItem(APIPath.SENDMAIL,this.formData)
    .subscribe((res: any) => {
      this.mailModel = {} as Mail;
      this.refreshListEvt.emit(null);
      this.closebutton.nativeElement.click();
    });

  }

 

  readFile(event) {
    this.file = (<HTMLInputElement>event.target).files[0];
  }
  
 

}
