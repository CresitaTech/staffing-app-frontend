import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobAgingComponent } from './job-aging.component';

describe('JobAgingComponent', () => {
  let component: JobAgingComponent;
  let fixture: ComponentFixture<JobAgingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobAgingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobAgingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
