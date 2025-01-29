import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { error } from 'protractor';
import { sequenceEqual } from 'rxjs/operators';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { EmailConfig } from 'src/app/models/email-config';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-email-setting',
  templateUrl: './email-setting.component.html',
  styleUrls: ['./email-setting.component.scss']
})
export class EmailSettingComponent implements OnInit {

  emailSetting = {} as EmailConfig;
  user_id: string;
  username: string;
  @ViewChild('closebutton') closebutton;
  flag: boolean = false;
  constants = Constants;
  constructor(
    private service: APIProviderService<EmailConfig>,
    public activeModal: NgbActiveModal,
  ) { }

  ngOnInit(): void {
    this.user_id = sessionStorage.getItem("user_id");
    //this.emailSetting.first_name= sessionStorage.getItem("FirstName");
    //this.emailSetting.last_name= sessionStorage.getItem("LastName");
    //this.emailSetting.email=sessionStorage.getItem("username");
    this.service.getCollectionItemById(APIPath.EMAIL_GET_CONFIG, "").subscribe(res => {
      if (res) {
        console.log(res)
        this.emailSetting.first_name = res[0].first_name;
        this.emailSetting.last_name = res[0].last_name;
        //this.emailSetting.email_from = res[0].email;
        this.emailSetting.send_by = res[0].send_by;
        this.emailSetting.email_cc = res[0].email_cc;
        this.emailSetting.password = res[0].password;
        this.emailSetting.cnfm_password = res[0].password;
        this.emailSetting.host_name = res[0].host_name;
        this.emailSetting.port = res[0].port;
        this.emailSetting.id = res[0].id;
        this.flag = true;
        this.emailSetting.email = res[0].email;
      }
    }, error => {
      console.log(error);
    })
  }



  onSubmit() {
    if (!this.flag)
      this.service.createCollectionItem(APIPath.EMAIL_CONGIF, this.emailSetting).subscribe(res => {
        this.emailSetting = {} as EmailConfig;
        this.closebutton.nativeElement.click();
      })

    else {
      this.service.putCollectionItemById(APIPath.EMAIL_CONGIF, this.emailSetting.id, this.emailSetting).subscribe(res => {
        this.emailSetting = {} as EmailConfig;
        this.closebutton.nativeElement.click();
      })
    }
  }

}
