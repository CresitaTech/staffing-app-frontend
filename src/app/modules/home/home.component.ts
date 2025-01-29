import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { EmailSettingComponent } from 'src/app/components/email-setting/email-setting.component';
import { Constants } from 'src/app/enums/constants.enum';
import { Roles } from 'src/app/enums/role.enum';
import { Permission } from 'src/app/models/permission';
import { User } from 'src/app/models/user';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { AuthService } from 'src/app/services/auth/auth.service';
declare const $: any;


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('sidebarCollapse') sidebarCollapse: HTMLButtonElement;
  private sub1$: Subscription;
  user: User = {} as User;
  Roles = Roles;
  role: Roles;

  constructor(
    private auth: AuthService,
    private router: Router,
    public _api: APIProviderService<any>,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    $('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
    });
    this.getUser();
  }

  ngAfterViewInit() {
    // load external js here
    this.loadMenuScript();
  }

  ngOnDestroy(): void {
    if (this.sub1$) this.sub1$.unsubscribe();
  }

  private loadMenuScript(): void {
    console.log('loading script here');
    const scriptUrl = '/assets/js/menu-new.js';
    let node = document.createElement('script');
    node.src = scriptUrl;
    node.type = 'text/javascript';
    node.async = true;
    document.getElementsByTagName('head')[0].appendChild(node);
  }

  getUser() {
    this.sub1$ = this.auth.getLoggedinUser(sessionStorage.getItem(Constants.USER_ID))
      .subscribe((res: User) => {
        this.user = res;
        sessionStorage.setItem("FirstName", this.user.first_name);
        sessionStorage.setItem("LastName", this.user.last_name)

        this.role = this.user.groups[0].name.toUpperCase() as Roles;
        const permissions: Array<Permission> = this.user.groups[0].permissions.concat(this.user.user_permissions);
        this.auth.setPermissions(permissions);
        this.auth.setRole(this.role);
      })
  }

  logout(): void {
    const remember = JSON.parse(localStorage.getItem('isRemember'));
    this.auth.logout().subscribe(res => {
      if (remember === true) {
        const username = sessionStorage.getItem('username');
        localStorage.setItem('username', username);
        localStorage.setItem('isRemember', JSON.stringify(true));
      }
      else {
        localStorage.clear();
      }
      sessionStorage.clear();
      this.router.navigate(['/login']);
    });
  }

  openEmailModel(){
    const modalRef = this.modalService.open(EmailSettingComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    // modalRef.componentInstance.id = userId;
    // modalRef.componentInstance.title = Constants.INTERVIEW;
    // this.collection.forEach(item=>{if(item.id===userId)
    //   { modalRef.componentInstance.name=item.id;}})
    
    modalRef.result.then(res => {
      // if (res.result) {
      //   this.deleteCollectionItem(res.id);
      // }
    });
  }

}
