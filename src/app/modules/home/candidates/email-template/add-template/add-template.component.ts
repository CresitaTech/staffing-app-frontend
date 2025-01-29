import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { EmailTemplate } from 'src/app/models/email-template';
import { APIProviderService } from 'src/app/services/api-provider.service';


@Component({
  selector: 'app-add-template',
  templateUrl: './add-template.component.html',
  styleUrls: ['./add-template.component.scss']
})


export class AddTemplateComponent implements OnInit {
  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;
  emailTemplate = {} as EmailTemplate;
  constants = Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;


  constructor(
    private service: APIProviderService<EmailTemplate>
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    if (this.indexAsInput != undefined)
      this.getTemplateById(this.indexAsInput);
  }


  getTemplateById(index: string) {
    this.service.getCollectionItemById(APIPath.EMAIL_TEMPLATE, index).subscribe((res) => {
      this.emailTemplate = res;
    }, error => {
      console.log(error);
    })
  }

  onEdit() {
    this.subscription2$ = this.service.putCollectionItemById
      (APIPath.EMAIL_TEMPLATE, this.indexAsInput, this.emailTemplate).subscribe((res) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);
      })
  }


  onSubmit() {
    console.log("**************************")
    console.log(this.emailTemplate);
    this.subscription1$ = this.service.createCollectionItem(APIPath.EMAIL_TEMPLATE, this.emailTemplate)
      .subscribe((res: any) => {
        console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);
      });
  }

  refreshOnModifyOrAdd() {
    this.emailTemplate = {} as EmailTemplate;
    //window.location.reload();
    this.refreshListEvt.emit(null);
  }

}
