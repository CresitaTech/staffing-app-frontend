import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnassignedJobsComponent } from './unassigned-jobs.component';

describe('UnassignedJobsComponent', () => {
  let component: UnassignedJobsComponent;
  let fixture: ComponentFixture<UnassignedJobsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnassignedJobsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnassignedJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
