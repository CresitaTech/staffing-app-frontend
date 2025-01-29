import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobEmailTemplateComponent } from './job-email-template.component';

describe('JobEmailTemplateComponent', () => {
  let component: JobEmailTemplateComponent;
  let fixture: ComponentFixture<JobEmailTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobEmailTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
