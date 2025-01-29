import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobDescriptionsRoutingModule } from './job-descriptions-routing.module';
import { JobDescriptionsComponent } from './job-descriptions.component';
import { SharedModule } from 'src/app/components/shared-components.module';
import { AddJobCustomFieldsComponent } from './job-custom-fields/add-job-custom-fields/add-job-custom-fields.component';
import { CustomJobFieldsComponent } from './job-custom-fields/job-custom-fields.component';
import { JobEmailTemplateModule } from './job-email-template/job-email-template.module';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { NgSelectModule } from '@ng-select/ng-select';
;


@NgModule({
  declarations: [JobDescriptionsComponent, AddJobCustomFieldsComponent, CustomJobFieldsComponent],
  imports: [
    CommonModule,
    JobDescriptionsRoutingModule,
    SharedModule,
    JobEmailTemplateModule,
    FormsModule,
    Ng2SearchPipeModule,
    PipeModule,
    FormsModule,
    NgSelectModule,
    QuillModule.forRoot(),
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  exports: []
})
export class JobDescriptionsModule { }
