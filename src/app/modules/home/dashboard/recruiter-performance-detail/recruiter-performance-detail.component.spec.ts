import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecruiterPerformanceDetail } from './recruiter-performance-detail.component';

describe('RecruiterPerformanceDetail', () => {
  let component: RecruiterPerformanceDetail;
  let fixture: ComponentFixture<RecruiterPerformanceDetail>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecruiterPerformanceDetail ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecruiterPerformanceDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
