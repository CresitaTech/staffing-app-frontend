import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Roles } from 'src/app/enums/role.enum';
import { Group } from 'src/app/models/group';
import { Permission } from 'src/app/models/permission';
import { User } from 'src/app/models/user';
import { BaseService } from '../base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseService {

  public role: Roles;

  private _groups: BehaviorSubject<Array<Group>> = new BehaviorSubject(null);
  setGroup(groups: Array<Group>) { this._groups.next(groups) }
  getGroup(): Observable<Array<Group>> { return this._groups.asObservable() }

  private _role: BehaviorSubject<Roles> = new BehaviorSubject(null);
  setRole(role: Roles) { this._role.next(role); this.role = role; }
  getRole(): Observable<Roles> { return this._role.asObservable() }

  private _permissions: BehaviorSubject<Array<Permission>> = new BehaviorSubject(null);
  setPermissions(permission: Array<Permission>) { this._permissions.next(permission); }
  getPermissions(): Observable<Array<Permission>> { return this._permissions.asObservable() }

  constructor(http: HttpClient) {
    super(http);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.endpoint}/users/login/`, { username, password })
  }


  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.endpoint}/users/password_reset/`, { email })
  }

  resetPassword(password: string, token: string): Observable<any> {
    return this.http.post(`${this.endpoint}/users/password_reset/confirm/`, { password, token })
  }

  validateToken(token: string): Observable<any> {
    return this.http.post(`${this.endpoint}/users/password_reset/validate_token/`, { token })
  }

  getLoggedinUser(uuid: string): Observable<User> {
    return this.http.get<User>(`${this.endpoint}/users/users/${uuid}/`)
  }

  logout(): Observable<any> {
    this._role.next(null);
    this._permissions.next(null);
    return this.http.get(`${this.endpoint}/users/logout/`)
  }

}
