import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobDescriptionDeleteComponent } from './job-description-delete.component';

describe('JobDescriptionDeleteComponent', () => {
  let component: JobDescriptionDeleteComponent;
  let fixture: ComponentFixture<JobDescriptionDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobDescriptionDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDescriptionDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
