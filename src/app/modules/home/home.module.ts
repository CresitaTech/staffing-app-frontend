import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HomeComponent } from './home.component';
import { AdministrationComponent } from './administration/administration.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    SidebarComponent,
    HomeComponent,
    AdministrationComponent,

  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    FormsModule,
    NgMultiSelectDropDownModule.forRoot(),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeModule { }
