import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddRtrComponent } from './add-rtr/add-rtr.component';
import { RtrComponent } from './rtr.component';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { FormsModule } from '@angular/forms';
import { SharedModule } from './../../../../components/shared-components.module'
import { CandidateModule } from '../candidate/candidate.module';
import { RtrRoutingModule } from './rtr-routing.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { PipeModule } from 'src/app/pipes/pipe.module';



@NgModule({
  declarations: [AddRtrComponent, RtrComponent, 
    
  ],
  imports: [
    CommonModule,
    RtrRoutingModule,
    Ng2SearchPipeModule,
    FormsModule,
    SharedModule,
    CandidateModule,
    NgSelectModule,
    PipeModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RtrModule { }
