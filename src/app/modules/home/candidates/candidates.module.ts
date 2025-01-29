import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CandidatesRoutingModule } from './candidates-routing.module';

import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    CandidatesRoutingModule,
    FormsModule,
    NgbModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CandidatesModule { }
