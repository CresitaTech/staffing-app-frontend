import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Designation } from 'src/app/models/designation';
import { BaseService } from '../base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class DesignationService extends BaseService{

  constructor(http: HttpClient) { super(http) }

  getAllDesignations(): Observable<Array<Designation>>{
    return this.http.get<Array<Designation>>(`${this.endpoint}/interviewers/designation/`)
  }

  getDesignationById(id: number): Observable<Designation> {
    return this.http.get<Designation>(`${this.endpoint}/interviewers/designation/${id}/`)
  }

  createDesignation(designation: Designation): Observable<Designation>{
    return this.http.post<Designation>(`${this.endpoint}/interviewers/designation/`, designation)
  }
  
  editDesignation(designation: Designation): Observable<Designation> {
    return this.http.put<Designation>(`${this.endpoint}/interviewers/designation/${designation.id}/`, designation)
  }

  deleteDesignation(id: number) : Observable<any> {
    return this.http.delete<any>(`${this.endpoint}/interviewers/designation/${id}/`)
  }

}
