import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/enums/constants.enum';
import { PredefinedPermissions } from 'src/app/enums/predefined-permissions';
import { Roles } from 'src/app/enums/role.enum';
import { Permission } from 'src/app/models/permission';
import { AuthService } from 'src/app/services/auth/auth.service';
declare const $: any;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styles: [`
    #sidebar {
      height: 100%;
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {

  constant = Constants;
  roles = Roles;
  role: Roles;
  permissionSet = new Set<string>();
  predefined_permissions = PredefinedPermissions;
  roleSub$: Subscription;
  permissionSub$: Subscription;

  constructor(
    private auth: AuthService,
    private router:Router
  ) { }

  ngOnInit(): void {
    this.getRole();
    this.getPermission();
  }

  ngOnDestroy() {
    if (this.roleSub$) this.roleSub$.unsubscribe();
    this.permissionSet.clear();
    this.auth.setPermissions(null);
    if (this.permissionSub$) this.permissionSub$.unsubscribe();
  }

  toggle() {
    $('#sidebar').toggleClass('active');
  }

  getRole(): void {
    this.roleSub$ = this.auth.getRole()
      .subscribe((res: Roles) => {
        this.role = res;
      });
  }

  getPermission(): void {
    this.permissionSub$ = this.auth.getPermissions()
      .subscribe((res: Array<Permission>) => {
        if (res && res.length > 0) {
          this.makePermissionSet(res)
        }
      });
  }

  makePermissionSet(permissions: Array<Permission>): void {
    permissions = permissions.filter(f => {
      if (f.codename.indexOf('view_') !== -1) {
        this.permissionSet.add(f.codename);
      }
    });
  }

  canLoad(models: Array<PredefinedPermissions>): boolean {
    if (this.role === Roles.ADMIN) {
      return true;
    } else {
      if (models.length > 1) {
        let flag = false;
        for (let index = 0; index < models.length; index++) {
          if (this.lookUpPermissions(models[index]))
            flag = true;
          break;
        }
        return flag;
      } else if (models.length == 1) {
        return (this.lookUpPermissions(models[0]))
      }
    }
  }

  lookUpPermissions(model: PredefinedPermissions): boolean {
    return this.permissionSet.has(model) ? true : false;
  }


  onRefresh() {
    this.router.routeReuseStrategy.shouldReuseRoute = function(){return false;};

    let currentUrl = this.router.url + '?';

    this.router.navigateByUrl(currentUrl)
      .then(() => {
        this.router.navigated = false;
        this.router.navigate([this.router.url]);
      });
    }

}
