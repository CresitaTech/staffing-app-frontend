import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateReviewMessageComponent } from './candidate-review-message.component';

describe('CandidateReviewMessageComponent', () => {
  let component: CandidateReviewMessageComponent;
  let fixture: ComponentFixture<CandidateReviewMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateReviewMessageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateReviewMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
