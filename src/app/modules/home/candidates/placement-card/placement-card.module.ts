import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddCardComponent } from './add-card/add-card.component';
// import { CardFiltersComponent } from './card-filters/card-filters.component';
import { PlacementCardComponent } from './placement-card.component';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared-components.module';
import { ClientsModule } from '../../clients/clients.module';
import { PlacementCardRoutingModule } from './placement-card-routing.module';
import { CandidateModule } from '../candidate/candidate.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  declarations: [AddCardComponent, 
    // CardFiltersComponent,
    PlacementCardComponent],
  imports: [
    CommonModule,
    PlacementCardRoutingModule,
    Ng2SearchPipeModule,
    FormsModule,
    SharedModule,
    PipeModule,
    NgSelectModule,
    ClientsModule,
    CandidateModule,
    NgbModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlacementCardModule { }
