import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientsComponent } from './clients.component';
import { AddClientComponent } from './add-client/add-client.component';
import { FormsModule } from '@angular/forms';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { ClientInlineComponent } from './client-inline/client-inline.component';
import { ClientDeleteComponent } from './client-delete/client-delete.component';
import { SharedModule } from './../../../components/shared-components.module'
import { NgSelectModule } from '@ng-select/ng-select';
import { ClientsRoutingModule } from './clients-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { ClientImportComponent } from './client-import/client-import.component';
import { ClientTableComponent } from './client-table/client-table.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [ClientsComponent, AddClientComponent,
    // ClientFiltersComponent, 
    ClientInlineComponent, ClientDeleteComponent, ClientImportComponent, ClientTableComponent],
  imports: [
    CommonModule,
    ClientsRoutingModule,
    HttpClientModule,
    Ng2SearchPipeModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    NgbModule,
    PipeModule
  ],
  exports: [AddClientComponent, ClientInlineComponent, ClientDeleteComponent,
    // ClientFiltersComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class ClientsModule { }
