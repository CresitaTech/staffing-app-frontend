import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class EmailTemplateService extends BaseService {

  constructor(
  http:HttpClient
  ) {
    super(http);
  }

  getTemplateList(): Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/emailTemplate/`);
  }

  deleteTemplate(id): Observable<any> {
    return this.http.delete(`${this.endpoint}/candidates/emailTemplate/${id}`, {})
  }

  postTemplate(emailTemplate:any):Observable<any>{
    return this.http.post(`${this.endpoint}/candidates/emailTemplate/`, emailTemplate)
  }

  getTemplateById(id):Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/emailTemplate/${id}`)
  }

  putTemplate(id,emailTemplate:any):Observable<any>{
    return this.http.put(`${this.endpoint}/candidates/emailTemplate/${id}/`, emailTemplate)

  }
}
