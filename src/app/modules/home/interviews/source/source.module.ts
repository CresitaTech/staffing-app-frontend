import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SourceRoutingModule } from './source-routing.module';
import { SourceComponent } from './source.component';
import { AddSourceComponent } from './add-source/add-source.component';
// import { SourceFilterComponent } from './source-filter/source-filter.component';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SourceInlineComponent } from './source-inline/source-inline.component';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  declarations: [SourceComponent, AddSourceComponent, 
    // SourceFilterComponent,
    SourceInlineComponent],
  imports: [
    CommonModule,
    FormsModule,
    SourceRoutingModule,
    PipeModule,
    Ng2SearchPipeModule,
    NgbModule,
    NgSelectModule,
  ],
  exports:[SourceInlineComponent]

})
export class SourceModule { }
