import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { time } from 'console';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { APIPath } from '../enums/api-path.enum';
import { GlobalApiResponse } from '../models/global_api_response';
import { BaseService } from './base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class APIProviderService<T> extends BaseService {


  private _ip: URL = new URL(this.endpoint);
  public get ip(): string { return this._ip.origin }


  private headers = new HttpHeaders().set('content-type', 'application/json');

  constructor(http: HttpClient) {
    super(http);
    console.log(this.ip);
  }

  getListAPI(url: String): Observable<any> {
    return this.http.get(`${this.endpoint}${url}`);
  }

  deleteAPI(url: String, id): Observable<any> {
    return this.http.delete(`${this.endpoint}${url}${id}`, {})
  }

  postAPI(url: String, item: any): Observable<any> {
    return this.http.post(`${this.endpoint}${url}`, item)
  }

  getIdAPI(url: String, id): Observable<any> {
    return this.http.get(`${this.endpoint}${url}${id}/`)

  }


  putIdAPI(url: String, id, item: any): Observable<any> {
    return this.http.put(`${this.endpoint}${url}${id}/`, item)

  }



  exportCollection(segment: string, sort: string, responseType, adFilterQueries?: string) {
    return this.http.get<GlobalApiResponse<T>>(`${this.endpoint}${segment}?ordering=${sort}${adFilterQueries ? adFilterQueries : ''}`, { responseType }).
      pipe(timeout(360000), catchError(e => {
        return of(null);
      }))
  }


  getCollection(segment: APIPath, offset: number, limit: number, search: string, sort: string, adFilterQueries?: string): Observable<GlobalApiResponse<T>> {
    return this.http
      .get<GlobalApiResponse<T>>(`${this.endpoint}${segment}?limit=${limit}&offset=${offset}&search=${search}&ordering=${sort}${adFilterQueries ? adFilterQueries : ''}`)
    // .pipe(timeout(3000), catchError(e => {
    //   // TODO: do something
    //   return of(null);
    // }));
  }

  createCollectionItem(segment: APIPath, item: any): Observable<T> {
    return this.http.post<T>(`${this.endpoint}${segment}`, item)
  }

  deleteCollectionItemById(segment: APIPath, id: string | number): Observable<T> {
    return this.http.delete<T>(`${this.endpoint}${segment}${id}/`)
  }

  deleteCollectionItemByIdString(segment: APIPath, idString: any): Observable<T> {
    return this.http.post<T>(`${this.endpoint}${segment}`, idString, { 'headers': this.headers })
  }

  getCollectionItemById(segment: APIPath, id: string | number): Observable<T> {
    return this.http.get<T>(`${this.endpoint}${segment}${id}`)
  }

  getCollectionItemByJobId(segment: APIPath, id: string | number): Observable<T> {
    return this.http.get<T>(`${this.endpoint}${segment}?job_id=${id}`)
  }

  getCollectionItemByListandTemplateId(segment: APIPath, campaignId: string, listId: string): Observable<T> {
    return this.http.get<T>(`${this.endpoint}${segment}?campaign_id=${campaignId}&list_id=${listId}`)
  }

  getCollectionItemByListId(segment: APIPath, id: string | number, limit: number, search: string): Observable<T> {
    return this.http.get<T>(`${this.endpoint}${segment}?list_id=${id}&limit=${limit}&offset=0&search=${search}&ordering=-created_at`)
  }

  getCollectionItemByCandidateId(segment: APIPath, id: string | number): Observable<T> {
    return this.http.get<T>(`${this.endpoint}${segment}?candidate_id=${id}`)
  }
  getCollectionItemByCandidateIdInternal(segment: APIPath, id: string | number): Observable<T> {
    return this.http.get<T>(`${this.endpoint}${segment}?candidate_id=${id}&status=internal`)
  }


  putCollectionItemById(segment: APIPath, id: string | number, item: any): Observable<T> {
    return this.http.put<T>(`${this.endpoint}${segment}${id}/`, item)
  }

  patchCollectionItemById(segment: APIPath, id: string | number, item: any): Observable<T> {
    return this.http.patch<T>(`${this.endpoint}${segment}${id}/`, item)
  }


  getReportWithApiLink(api: string, responseType?): Observable<any> {
    return this.http.get<T>(`${this.endpoint}${api}`, { responseType });
  }


}
