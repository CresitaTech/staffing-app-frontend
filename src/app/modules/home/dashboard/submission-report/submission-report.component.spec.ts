import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionReportComponent } from './submission-report.component';

describe('SubmissionDetailsComponent', () => {
  let component: SubmissionReportComponent;
  let fixture: ComponentFixture<SubmissionReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmissionReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
