import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../base-service/base-service.service';


@Injectable({
  providedIn: 'root'
})
export class ClientService  extends BaseService{

  constructor(
   http:HttpClient
  ) {
    super(http);
   }

   getClientList(): Observable<any>{
    return this.http.get(`${this.endpoint}/clients/client/`);
  }

  
  postClient(client:any): Observable<any>{
    return this.http.post(`${this.endpoint}/clients/client/`, client);
  }

  deleteClient(id): Observable<any> {
    return this.http.delete(`${this.endpoint}/clients/client/${id}/`, {});
  }

  getClientById(id):Observable<any>{
    return this.http.get(`${this.endpoint}/clients/client/${id}`)
  }

  putClient(id,client:any):Observable<any>{
    return this.http.put(`${this.endpoint}/clients/client/${id}/`, client)

  }

}
