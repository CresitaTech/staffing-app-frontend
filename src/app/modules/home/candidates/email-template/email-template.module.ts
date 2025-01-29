import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddTemplateComponent } from './add-template/add-template.component';
// import { TemplateFilterComponent } from './template-filter/template-filter.component';
import { RouterModule, Routes } from '@angular/router';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { FormsModule } from '@angular/forms';
import { EmailTemplateComponent } from './email-template.component';
import { SharedModule } from 'src/app/components/shared-components.module';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TemplateInlineComponent } from './template-inline/template-inline.component';

const routes: Routes = [{
  path: '',
  component: EmailTemplateComponent,
}];

@NgModule({
  declarations: [AddTemplateComponent,EmailTemplateComponent ,TemplateInlineComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    Ng2SearchPipeModule,
    FormsModule,
    SharedModule,
    NgbModule,
    NgSelectModule,
    PipeModule
  ],
  exports:[TemplateInlineComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class EmailTemplateModule { }
