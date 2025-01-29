import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Http_Interceptor } from './services/http-interceptor/http-interceptor.interceptor';
import { AlertComponent } from './components/alert/alert.component';
import { NgbActiveModal, NgbDatepickerModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { QuillModule } from 'ngx-quill';
import {
  NgxUiLoaderModule,
  NgxUiLoaderConfig,
  NgxUiLoaderRouterModule,
  NgxUiLoaderHttpModule
} from 'ngx-ui-loader';
import { ErrorPageComponent } from './components/error-page/error-page.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  bgsColor: '#26ae61',
  bgsPosition: 'center-center',
  bgsOpacity: 0.4,
  bgsType: "square-jelly-box",
  fastFadeOut: true,
  fgsType: "square-jelly-box",
  fgsColor: '#26ae61',
  pbColor: '#26ae61',
  hasProgressBar: true,
  overlayColor: 'rgba(0,0,0,.3)',
};

@NgModule({
  declarations: [
    AppComponent,
    AlertComponent,
    ErrorPageComponent,
  ],
  imports: [
    MatSlideToggleModule,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    NgbDatepickerModule,
    NgSelectModule,
    Ng2SearchPipeModule,
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    NgxUiLoaderRouterModule, // import this module for showing loader automatically when navigating between app routes
    NgxUiLoaderHttpModule.forRoot({ showForeground: true }),
    QuillModule.forRoot(),
    BrowserAnimationsModule
    //   NgxDocViewerModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: Http_Interceptor, multi: true },
    NgbActiveModal
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
