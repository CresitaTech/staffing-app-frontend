import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorTemplateComponent } from './vendor-template.component';

describe('VendorTemplateComponent', () => {
  let component: VendorTemplateComponent;
  let fixture: ComponentFixture<VendorTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
