import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailListInlineComponent } from './email-list-inline/email-list-inline.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { SharedModule } from 'src/app/components/shared-components.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { EmailListComponent } from './email-list.component';
import { RouterModule, Routes } from '@angular/router';
import { EmailListDetailsComponent } from './email-list-details/email-list-details.component';

const routes: Routes = [{
  path: '',
  component: EmailListComponent,
}];

@NgModule({
  declarations: [EmailListComponent, EmailListDetailsComponent, EmailListInlineComponent],
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
  exports: [EmailListInlineComponent]
})
export class EmailListModule { }
