import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseService {

  protected endpoint: string = environment.endpoint;

  constructor(protected http: HttpClient) {}
}
