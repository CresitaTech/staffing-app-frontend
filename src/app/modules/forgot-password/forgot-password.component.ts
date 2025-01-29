import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { Constants } from '../../enums/constants.enum';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/services/alert/alert.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { InfoDialogComponent } from 'src/app/components/info-dialog/info-dialog.component';
const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false };

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  loginSub: Subscription;
  constants = Constants;
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    public alert: AlertService,
    private modalService: NgbModal,

  ) { }


  ngOnInit(): void {
    this.createForm();


  }

  ngOnDestroy(): void {
    if (this.loginSub) this.loginSub.unsubscribe();
  }

  createForm(): void {

    var username = "";


    this.loginForm = this.fb.group({
      username: new FormControl(username, Validators.compose([Validators.required])),
    })
  }

  onSubmit() {

    this.loginSub = this.auth
      .forgotPassword(this.loginForm.get('username').value)
      .subscribe((res: any) => {
        if (res && res.status && res.status == "OK") {

          const modalRef = this.modalService.open(InfoDialogComponent, _NgbModalOptions);
          modalRef.componentInstance.description = "Thanks, you will receive a link to reset your password at "+this.loginForm.get('username').value+"\nIf you don't see the email within 6 hours, check your spam or junk folder before submitting a new request.";
          modalRef.componentInstance.title = "Forgot password";

          modalRef.result.then(res => {
            this.router.navigate(['/login'])
          });

         
        } else if (res && res.email && res.email.lenght > 0) {
          this.alert.success(res.email[0]);
        }


      });
  }

  get username() {
    return this.loginForm.get('username');
  }

}
