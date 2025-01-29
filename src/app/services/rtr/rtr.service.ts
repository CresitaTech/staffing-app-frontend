import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class RtrService extends BaseService{

  constructor(http:HttpClient) {
    super(http);
  }


  getRtrList(): Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/rtr/`);
  }

  deleteRtr(id): Observable<any> {
    return this.http.delete(`${this.endpoint}/candidates/rtr/${id}`, {})
  }

  postRtr(rtr:any):Observable<any>{
    return this.http.post(`${this.endpoint}/candidates/rtr/`, rtr)
  }

  getRtrById(id):Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/rtr/${id}`)
  }

  putRtr(id,rtr:any):Observable<any>{
    return this.http.put(`${this.endpoint}/candidates/rtr/${id}/`, rtr)

  }
  
}
