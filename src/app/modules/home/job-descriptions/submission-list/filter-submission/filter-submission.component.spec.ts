import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSubmissionComponent } from './filter-submission.component';

describe('FilterSubmissionComponent', () => {
  let component: FilterSubmissionComponent;
  let fixture: ComponentFixture<FilterSubmissionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterSubmissionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
