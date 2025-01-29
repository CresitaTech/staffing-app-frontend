import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorListDetailsComponent } from './vendor-list-details.component';

describe('VendorListDetailsComponent', () => {
  let component: VendorListDetailsComponent;
  let fixture: ComponentFixture<VendorListDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorListDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorListDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
