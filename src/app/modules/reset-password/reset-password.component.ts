import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { Constants } from '../../enums/constants.enum';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { InfoDialogComponent } from 'src/app/components/info-dialog/info-dialog.component';
const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false };
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPassword implements OnInit, OnDestroy {

  loginForm: FormGroup;
  loginSub: Subscription;
  togglePassword: boolean = false;
  toggleRePassword: boolean = false;
  constants = Constants;
  token: string;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,

  ) { }


  ngOnInit(): void {
    this.createForm();

    this.route.queryParams
      .subscribe(params => {
        console.log(params);
        this.token = params.token;
        console.log(this.token);
        if (this.token) {
          this.validateToken();
        }
      }
      );
  }

  ngOnDestroy(): void {
    if (this.loginSub) this.loginSub.unsubscribe();
  }

  createForm(): void {

    this.loginForm = this.fb.group({
      password: new FormControl(new String(''), Validators.compose([Validators.required, Validators.minLength(6)])),
      repassword: new FormControl(new String(''), Validators.compose([Validators.required, Validators.minLength(6)])),
    }, {
      validator: this.ConfirmedValidator('password', 'repassword')
    })
  }

  validateToken() {

    this.loginSub = this.auth
      .validateToken(this.token)
      .subscribe((res: any) => {
        console.log(res);
        if (res.status !== "OK") {
          this.router.navigate(['/login'])
        }
      });

  }

  onSubmit() {

    this.loginSub = this.auth
      .resetPassword(this.loginForm.get('password').value, this.token)
      .subscribe((res: any) => {

        if (res && res.status && res.status == "OK") {

          const modalRef = this.modalService.open(InfoDialogComponent, _NgbModalOptions);
          modalRef.componentInstance.description = "Your password resetted successfully. Please login with your new password";
          modalRef.componentInstance.title = "Password reset";

          modalRef.result.then(res => {
            this.router.navigate(['/login'])
          });

         
        } else if (res && res.email && res.email.lenght > 0) {
          // this.alert.success(res.email[0]);
        }

        // this.router.navigate(['/login'])
      });
  }

  get repassword() {
    return this.loginForm.get('repassword');
  }
  get password() {
    return this.loginForm.get('password');
  }

  ConfirmedValidator(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];
      if (matchingControl.errors && !matchingControl.errors.confirmedValidator) {
        return;
      }
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ confirmedValidator: true });
      } else {
        matchingControl.setErrors(null);
      }
    }
  }

}
