import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ReportsComponent } from './reports.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared-components.module';


@NgModule({
  declarations: [ReportsComponent],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    NgbModule,
    FormsModule,
    SharedModule,
    DashboardModule,
  ]
})
export class ReportsModule { }
