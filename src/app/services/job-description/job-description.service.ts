import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobDescription } from 'src/app/models/job-description';
import { BaseService } from '../base-service/base-service.service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class JobDescriptionService extends BaseService {

  getNewJobDescriptionId(previous: string): string {
    const m = moment();
    const temp = parseInt(previous) + 1;
    const currentId = temp > 9 ? temp : `0${temp}`
    return `OP-JDID${m.year()}${m.month() + 1}${m.date()}${currentId}`
  }

  constructor(http: HttpClient) { super(http) }

  getAllJobDescriptions(): Observable<Array<JobDescription>>{
    return this.http.get<Array<JobDescription>>(`${this.endpoint}/jobdescriptions/jobdescription/`);
  }

  getJobDescriptionById(id: number): Observable<JobDescription> {
    return this.http.get<JobDescription>(`${this.endpoint}/jobdescriptions/jobdescription/${id}/`)
  }

  createJobDescription(jobDescription: JobDescription): Observable<JobDescription> {
    return this.http.post<JobDescription>(`${this.endpoint}/jobdescriptions/jobdescription/`, jobDescription)
  }

  editJobDescription(id: number, jobDescription: JobDescription): Observable<JobDescription> {
    return this.http.put<JobDescription>(`${this.endpoint}/jobdescriptions/jobdescription/${id}/`, jobDescription)
  }

  deleteJobDescription(id: number): Observable<any> {
    return this.http.delete<any>(`${this.endpoint}/jobdescriptions/jobdescription/${id}/`)
  }
}
