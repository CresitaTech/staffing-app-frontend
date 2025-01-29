import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupRoutingModule } from './group-routing.module';
import { GroupComponent } from './group.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/components/shared-components.module';
import { GroupDetailComponent } from './group-detail/group-detail.component';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { GroupInlineComponent } from './group-inline/group-inline.component';


@NgModule({
  declarations: [GroupComponent, GroupDetailComponent, GroupInlineComponent],
  imports: [
    CommonModule,
    GroupRoutingModule,
    NgbModule,
    FormsModule,
    NgSelectModule,
    SharedModule,
    PipeModule,
  ],
  exports: [GroupDetailComponent, GroupInlineComponent]
})
export class GroupModule { }
