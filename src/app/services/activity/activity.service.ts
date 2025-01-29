import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityService extends BaseService {

  constructor(
    http:HttpClient
  ) {
    super(http)
   }

  getActivity(): Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/activity/`);
  }

  deleteActivity(id): Observable<any> {
    return this.http.delete(`${this.endpoint}/candidates/activity/${id}`, {})
  }

  postActivity(activity:any):Observable<any>{
    return this.http.post(`${this.endpoint}/candidates/activity/`, activity)
  }

  getActivityById(id):Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/activity/${id}`)
  }

  putActivity(id,activity:any):Observable<any>{
    return this.http.put(`${this.endpoint}/candidates/activity/${id}/`, activity)

  }
}
