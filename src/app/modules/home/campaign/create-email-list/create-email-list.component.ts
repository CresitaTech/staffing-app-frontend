import { Component, OnInit, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalStack } from '@ng-bootstrap/ng-bootstrap/modal/modal-stack';
import { NgbModalWindow } from '@ng-bootstrap/ng-bootstrap/modal/modal-window';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Mail } from 'src/app/models/mail';
import { EmailList } from 'src/app/models/email-list';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { RouteReuseStrategy } from '@angular/router'

@Component({
  selector: 'app-create-email-list',
  templateUrl: './create-email-list.component.html',
  styleUrls: ['./create-email-list.component.scss']
})
export class CreateEmailListComponent implements OnInit {

  @ViewChild('closebutton') closebutton;

  @Input() emailIdArray;
  @Input() eventId;

  @Output() refreshListEvt = new EventEmitter<any>();

  constants = Constants;
  formData: any;
  emailList = {} as EmailList;
  tagName = Constants.VENDOR_LIST;

  constructor(private service: APIProviderService<EmailList>,
    private router: Router,
    public activeModal: NgbActiveModal) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.emailList.list_data = this.emailIdArray;
    this.emailList.list_size = this.emailIdArray.length;
    this.emailList.list_description = '';
    this.emailList.template_name = null;
  }

  ngOnChanges(): void {
    this.emailList.list_data = this.emailIdArray;
    this.emailList.list_size = this.emailIdArray.length;

  }

  onSubmit() {
    this.formData = new FormData();
    this.formData.append('list_description', this.emailList.list_description);
    this.formData.append('list_name', this.emailList.list_name);
    this.formData.append('list_size', this.emailIdArray.length);
    this.formData.append('list_data', this.emailIdArray);
    this.formData.append("template_name", this.emailList.template_name);
    console.log(this.formData.get('list_data'))

    this.service.createCollectionItem(APIPath.VENDOR_LIST, this.formData)
      .subscribe((res: any) => {
        this.emailList = {} as EmailList;
        this.formData = {} as FormData;
        console.log(this.formData)
        console.log(this.emailList)
        this.refreshListEvt.emit(null);
        this.closebutton.nativeElement.click();
        this.router.navigate(['/home/campaign/email-list']);
      });
  }
}