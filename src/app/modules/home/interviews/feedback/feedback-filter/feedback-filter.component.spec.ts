import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackFilterComponent } from './feedback-filter.component';

describe('FeedbackFilterComponent', () => {
  let component: FeedbackFilterComponent;
  let fixture: ComponentFixture<FeedbackFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeedbackFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
