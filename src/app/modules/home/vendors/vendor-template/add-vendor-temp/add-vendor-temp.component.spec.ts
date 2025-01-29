import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVendorTempComponent } from './add-vendor-temp.component';

describe('AddVendorTempComponent', () => {
  let component: AddVendorTempComponent;
  let fixture: ComponentFixture<AddVendorTempComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddVendorTempComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVendorTempComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
