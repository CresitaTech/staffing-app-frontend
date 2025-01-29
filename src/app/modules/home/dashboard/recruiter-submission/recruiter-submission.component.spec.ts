import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecruiterSubmissionComponent } from './recruiter-submission.component';

describe('RecruiterSubmissionComponent', () => {
  let component: RecruiterSubmissionComponent;
  let fixture: ComponentFixture<RecruiterSubmissionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecruiterSubmissionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecruiterSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
