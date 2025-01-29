import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RtrFiltersComponent } from './rtr-filters.component';

describe('RtrFiltersComponent', () => {
  let component: RtrFiltersComponent;
  let fixture: ComponentFixture<RtrFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RtrFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RtrFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
