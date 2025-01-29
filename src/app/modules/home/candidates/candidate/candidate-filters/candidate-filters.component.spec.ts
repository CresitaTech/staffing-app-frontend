import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateFiltersComponent } from './candidate-filters.component';

describe('CandidateFiltersComponent', () => {
  let component: CandidateFiltersComponent;
  let fixture: ComponentFixture<CandidateFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
