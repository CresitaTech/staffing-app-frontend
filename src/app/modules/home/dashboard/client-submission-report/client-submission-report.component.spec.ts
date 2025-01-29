import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientSubmissionReportComponent } from './client-submission-report.component';

describe('SubmissionDetailsComponent', () => {
  let component: ClientSubmissionReportComponent;
  let fixture: ComponentFixture<ClientSubmissionReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientSubmissionReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientSubmissionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
