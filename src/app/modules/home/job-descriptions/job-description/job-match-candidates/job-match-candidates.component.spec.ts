import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobMatchCandidatesComponent } from './job-match-candidates.component';

describe('JobMatchCandidatesComponent', () => {
  let component: JobMatchCandidatesComponent;
  let fixture: ComponentFixture<JobMatchCandidatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobMatchCandidatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JobMatchCandidatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
