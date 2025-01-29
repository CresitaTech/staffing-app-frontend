import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendorTempInlineComponent } from './vendor-temp-inline/vendor-temp-inline.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { SharedModule } from 'src/app/components/shared-components.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { VendorTemplateComponent } from './vendor-template.component';
import { RouterModule, Routes } from '@angular/router';
import { AddVendorTempComponent } from './add-vendor-temp/add-vendor-temp.component';

const routes: Routes = [{
  path: '',
  component: VendorTemplateComponent,
}];

@NgModule({
  declarations: [VendorTemplateComponent, AddVendorTempComponent, VendorTempInlineComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    Ng2SearchPipeModule,
    NgSelectModule,
    FormsModule,
    SharedModule,
    NgbModule,

    PipeModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [VendorTempInlineComponent]
})
export class VendorTemplateModule { }
