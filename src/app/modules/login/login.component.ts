import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { Constants } from '../../enums/constants.enum';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  loginSub: Subscription;
  togglePassword: boolean = false;
  constants = Constants;
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this.createForm();


  }

  ngOnDestroy(): void {
    if (this.loginSub) this.loginSub.unsubscribe();
  }

  createForm(): void {
    if (JSON.parse(localStorage.getItem('isRemember')) === true) {
      var username = localStorage.getItem('username');
      var remember = localStorage.getItem('isRemember') === 'true' ? true : false;
    } else {
      var username = "";
      var remember = false;
      localStorage.clear();
    }

    this.loginForm = this.fb.group({
      username: new FormControl(username, Validators.compose([Validators.required])),
      password: new FormControl(new String(''), Validators.compose([Validators.required, Validators.minLength(6)])),
      remember: new FormControl(remember)
    })
  }

  onSubmit() {
    const remember = JSON.parse(this.loginForm.get('remember').value);
    sessionStorage.setItem('username', this.loginForm.get('username').value);

    this.loginSub = this.auth
      .login(this.loginForm.get('username').value, this.loginForm.get('password').value)
      .subscribe((res: any) => {
        //console.log(res)
        sessionStorage.setItem(Constants.AUTH_TOKEN, res.token);
        sessionStorage.setItem(Constants.USER_ID, res.user_id); 
        sessionStorage.setItem('user_country', res.country); 
        console.log("country: " + res.country)
        localStorage.setItem('isRemember', JSON.stringify(remember));
        localStorage.setItem('bdmShortName', res.first_name.substring(0, 1) + '' + res.last_name.substring(0, 1))
        this.router.navigate(['/home'])
      });
  } 

  get username() {
    return this.loginForm.get('username');
  }
  get password() {
    return this.loginForm.get('password');
  }


}
