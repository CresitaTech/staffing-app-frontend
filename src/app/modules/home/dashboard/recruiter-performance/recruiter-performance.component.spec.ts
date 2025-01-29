import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecruiterPerformanceComponent } from './recruiter-performance.component';

describe('RecruiterPerformanceComponent', () => {
  let component: RecruiterPerformanceComponent;
  let fixture: ComponentFixture<RecruiterPerformanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecruiterPerformanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecruiterPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
