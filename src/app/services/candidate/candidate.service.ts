import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Candidate } from 'src/app/models/candidate';
import { BaseService } from '../base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class CandidateService extends BaseService {

  constructor(http: HttpClient) {
    super(http)
  }

  getCandidateList(): Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/candidate/`);
  }

  deleteCandidate(id): Observable<any> {
    return this.http.delete(`${this.endpoint}/candidates/candidate/${id}`, {})
  }

  postCandidate(candidate:any):Observable<any>{
    return this.http.post(`${this.endpoint}/candidates/candidate/`, candidate)
  }

  getCandidateById(id):Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/candidate/${id}`)
  }

  putCandidate(id,candidate:any):Observable<any>{
    return this.http.put(`${this.endpoint}/candidates/candidate/${id}/`, candidate)

  }
  


}
