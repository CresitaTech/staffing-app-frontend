import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JdassignAddListComponent } from './jdassign-add-list/jdassign-add-list.component';
// import { AssignmentFilterComponent } from './assignment-filter/assignment-filter.component';
import { RouterModule, Routes } from '@angular/router';
import { AssignmentListComponent } from './assignment-list.component';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared-components.module';
import { AssignmentListRoutingModule } from './assignment-list-routing.module';
import { UserModule } from '../../user/user.module';
import { PipeModule } from 'src/app/pipes/pipe.module';


@NgModule({
  declarations: [ JdassignAddListComponent, 
    // AssignmentFilterComponent, 
    AssignmentListComponent],
  imports: [
    CommonModule,
    AssignmentListRoutingModule,
    Ng2SearchPipeModule,
    FormsModule,
    SharedModule,
    UserModule,
    PipeModule
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class AssignmentListModule { }
