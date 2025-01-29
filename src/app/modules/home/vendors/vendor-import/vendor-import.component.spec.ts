import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorImportComponent } from './vendor-import.component';

describe('VendorImportComponent', () => {
  let component: VendorImportComponent;
  let fixture: ComponentFixture<VendorImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
