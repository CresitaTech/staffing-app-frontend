import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { Constants } from 'src/app/enums/constants.enum';
import { catchError } from 'rxjs/operators';
import { AlertService } from '../alert/alert.service';
import { AlertType } from 'src/app/models/alert';
import { Router } from '@angular/router';

@Injectable()
export class Http_Interceptor implements HttpInterceptor {

  constructor(
    public alert: AlertService,
    private router: Router
  ) { }
  options = {
    autoClose: true,
    keepAfterRouteChange: false
  };
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let new_request: HttpRequest<unknown>;
    if (request.url.match('\/login\/') || request.url.match('\/password_reset\/')) {
      // no change in request
      new_request = request;
      console.log("I am inside interceptor")

    } else {
      new_request = request.clone({
        setHeaders: {
          Authorization: `Token ${sessionStorage.getItem(Constants.AUTH_TOKEN)}`
        }
      })
    }
    return next.handle(new_request).pipe(
      catchError((error: HttpErrorResponse) => {
        let msg = '';
        let title = '';
        if (error.error.message || error.status) {
          console.log('in error')
          switch (error.status) {
            case 401: {
              msg = 'Unauthorized access, please login with valid credentials.';
              title = '401 Unauthorized!';
              this.router.navigate(['/login'])
              break;
            }
            case 403: {
              console.log('in 403')
              msg = "You do not have permission to perform this action. Please contact to your administrator";
              title = '403 Forbidden!';
              break;
            }
            case 400: {
              console.log("*********400 Bad Request************")
              console.log(error);
              if (request.url.match('\/login\/')) {
                msg = 'Wrong Username or Password - Please try again with correct credentials.';
                title = '401 Unauthorized!';
              }
              else if (error.error.primary_email) {
                msg = error.error.primary_email;
              }
              else if (error.error.list_name) {
                msg = error.error.list_name;
              }
              else if (error.error.email) {
                msg = error.error.email;
              }
              else if (error.error.password) {
                msg = error.error.password;
              }
              else if (error.error.detail) {
                msg = error.error.detail;
              }
              else if (error.error.details) {
                msg = error.error.details;
                title = "400 Bad Request!"
              }
              else if (error.error.message) {
                msg = error.error.message;
                title = "400 Bad Request!"
              }
              else if (error.error) {
                msg = JSON.stringify(error.error).split(":", 2)[0].replace(/{/g, "")+" "+JSON.stringify(error.error).split(":", 2)[1].replace(/"/g, "").replace(/]/g, "").replace(/}/g, "").replace(/\[/g, "");
                title = "400 Bad Request!"
              }
              else {
                msg = 'The server will not be able to process the request due to an apparent client error.';
                title = '400 Bad Request!';
              }
              break;
            }
            case 404: {
              msg = 'The requested resource could not be found. Please check again later.';
              title = '404 Not Found!';
               if (error.error.detail) {
                msg = error.error.detail;
              }
             
              break;
            }
            case 500: {
              // msg = error.message;
              msg = 'Due to some error, server is unable to handle request. Please contact admin if error persists.'
              title = '500 Internal Server Error!';
              break;
            }
            default: {
              msg = error.error.message;
              title = error.status + ' ' + error.error.error + '!';
            }
          }
        } else {
          msg = 'Unable to reach server. Please contact admin if error persists.';
          title = 'No Response!';
        }
        this.errorPopup(msg, title, error);
        console.log("error msg");
        console.log(msg);
        console.error(error)
        return throwError(error);
      })
    );
  }

  errorPopup(message: string, title: string, error: any) {
    console.log(message);
    this.alert.error(message, this.options)
  }
}