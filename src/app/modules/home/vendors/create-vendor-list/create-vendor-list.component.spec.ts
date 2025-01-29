import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateVendorListComponent } from './create-vendor-list.component';

describe('CreateVendorListComponent', () => {
  let component: CreateVendorListComponent;
  let fixture: ComponentFixture<CreateVendorListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateVendorListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateVendorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
