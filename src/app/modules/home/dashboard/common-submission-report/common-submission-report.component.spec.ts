import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSubmissionReportComponent } from './common-submission-report.component';

describe('CommonSubmissionReportComponent', () => {
  let component: CommonSubmissionReportComponent;
  let fixture: ComponentFixture<CommonSubmissionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonSubmissionReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonSubmissionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
