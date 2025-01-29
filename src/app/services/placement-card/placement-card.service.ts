import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../base-service/base-service.service';

@Injectable({
  providedIn: 'root'
})
export class PlacementCardService extends BaseService {

  constructor(
    http:HttpClient
  ) { 
    super(http);
  }

  getCardList(): Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/placement/`);
  }

  deleteCard(id): Observable<any> {
    return this.http.delete(`${this.endpoint}/candidates/placement/${id}`, {})
  }

  postCard(placementCard:any):Observable<any>{
    return this.http.post(`${this.endpoint}/candidates/placement/`, placementCard)
  }

  getCardById(id):Observable<any>{
    return this.http.get(`${this.endpoint}/candidates/placement/${id}`)
  }

  putCard(id,placementCard:any):Observable<any>{
    return this.http.put(`${this.endpoint}/candidates/placement/${id}/`, placementCard)

  }
}
