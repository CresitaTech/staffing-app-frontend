import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateMatchForJobComponent } from './candidate-match-for-job.component';

describe('CandidateMatchForJobComponent', () => {
  let component: CandidateMatchForJobComponent;
  let fixture: ComponentFixture<CandidateMatchForJobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateMatchForJobComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateMatchForJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
