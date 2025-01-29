import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignationRoutingModule } from './designation-routing.module';
import { SharedModule } from 'src/app/components/shared-components.module';
import { NgSelectModule } from '@ng-select/ng-select';

import { DesignationComponent } from './designation.component';
import { DesignationDetailComponent } from './designation-detail/designation-detail.component';
import { DesignationListComponent } from './designation-list/designation-list.component';
import { DesignationInlineComponent } from './designation-inline/designation-inline.component';
import { DesignationDeleteComponent } from './designation-delete/designation-delete.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PipeModule } from 'src/app/pipes/pipe.module';

@NgModule({
  declarations: [
    DesignationComponent, 
    DesignationDetailComponent, 
    DesignationListComponent, 
    DesignationInlineComponent, 
    DesignationDeleteComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    DesignationRoutingModule,
    NgSelectModule,
    NgbModule,
    PipeModule
  ],
  exports: [DesignationDetailComponent, DesignationInlineComponent, DesignationDeleteComponent]
})
export class DesignationModule { }
