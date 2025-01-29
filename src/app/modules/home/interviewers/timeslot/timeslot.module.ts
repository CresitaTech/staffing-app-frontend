import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimeslotRoutingModule } from './timeslot-routing.module';
import { TimeslotInlineComponent } from './timeslot-inline/timeslot-inline.component';
import { AddTimeslotComponent } from './add-timeslot/add-timeslot.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';


@NgModule({
  declarations: [TimeslotInlineComponent, AddTimeslotComponent],
  imports: [
    CommonModule,
    TimeslotRoutingModule,
    FormsModule,
    NgSelectModule,
  ],
  exports:[TimeslotInlineComponent]

})
export class TimeslotModule { }
