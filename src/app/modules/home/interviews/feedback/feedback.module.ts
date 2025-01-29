import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeedbackRoutingModule } from './feedback-routing.module';
import { FeedbackComponent } from './feedback.component';
import { AddFeedbackComponent } from './add-feedback/add-feedback.component';
// import { FeedbackFilterComponent } from './feedback-filter/feedback-filter.component';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [FeedbackComponent, AddFeedbackComponent, 
    // FeedbackFilterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FeedbackRoutingModule,
    PipeModule,
    Ng2SearchPipeModule,
  ]
})
export class FeedbackModule { }
