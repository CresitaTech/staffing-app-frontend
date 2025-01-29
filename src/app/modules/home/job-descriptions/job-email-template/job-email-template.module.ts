import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobEmailTempInlineComponent } from './job-email-temp-inline/job-email-temp-inline.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { SharedModule } from 'src/app/components/shared-components.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { JobEmailTemplateComponent } from './job-email-template.component';
import { RouterModule, Routes } from '@angular/router';
import { AddJobEmailTempComponent } from './add-job-email-temp/add-job-email-temp.component';

const routes: Routes = [{
  path: '',
  component: JobEmailTemplateComponent,
}];

@NgModule({
  declarations: [JobEmailTemplateComponent, AddJobEmailTempComponent, JobEmailTempInlineComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    Ng2SearchPipeModule,
    NgSelectModule,
    FormsModule,
    SharedModule,
    NgbModule,

    PipeModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [JobEmailTempInlineComponent]
})
export class JobEmailTemplateModule { }
