import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class CampaignService extends BaseService {

  constructor(http: HttpClient) {
    super(http)
  }

  getCustomFields(): Observable<any>{
    return this.http.get(`${this.endpoint}/campaigns/custom_fields/`);
  }

  deleteCustomField(id): Observable<any> {
    return this.http.delete(`${this.endpoint}/campaigns/custom_fields/${id}`, {})
  }

  postCustomField(fields:any):Observable<any>{
    return this.http.post(`${this.endpoint}/campaigns/custom_fields/`, fields)
  }

  getCustomFieldById(id):Observable<any>{
    return this.http.get(`${this.endpoint}/campaigns/custom_fields/${id}`)
  }

  putCustomField(id,candidate:any):Observable<any>{
    return this.http.put(`${this.endpoint}/campaigns/custom_fields/${id}/`, candidate)

  }
  


}
