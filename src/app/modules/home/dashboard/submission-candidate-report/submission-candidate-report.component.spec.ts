import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionCandidateReportComponent } from './submission-candidate-report.component';

describe('SubmissionDetailsComponent', () => {
  let component: SubmissionCandidateReportComponent;
  let fixture: ComponentFixture<SubmissionCandidateReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmissionCandidateReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionCandidateReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
