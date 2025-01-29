import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateRepositoryComponent } from './candidate-repository.component';
import { AddRepositoryComponent } from './add-repository/add-repository.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared-components.module';
import { CandidateModule } from '../candidates/candidate/candidate.module';
import { CandidateRepositoryRoutingModule } from './candidate-repository-routing.module';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { NgSelectModule } from '@ng-select/ng-select';


@NgModule({
  declarations: [CandidateRepositoryComponent, AddRepositoryComponent],
  imports: [
    CommonModule,
    Ng2SearchPipeModule,
    PipeModule,
    CandidateRepositoryRoutingModule,
    FormsModule,
    SharedModule,
    CandidateModule,
    NgSelectModule,
  
  ]
})
export class CandidateRepositoryModule { }
