import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserComponent } from './user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserRoutingModule } from './user-routing. module';
import { NgSelectModule } from '@ng-select/ng-select';
import { UsersInlineComponent } from './users-inline/users-inline.component';
import { SharedModule } from 'src/app/components/shared-components.module';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { GroupModule } from '../group/group.module';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';


@NgModule({
  declarations: [UserComponent, UsersInlineComponent, UserDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    UserRoutingModule,
    GroupModule,
    PipeModule,
    NgSelectModule,
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule.forRoot(),
  ],
  exports: [UsersInlineComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserModule { }
