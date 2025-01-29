import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobDescriptionInlineComponent } from './job-description-inline.component';

describe('JobDescriptionInlineComponent', () => {
  let component: JobDescriptionInlineComponent;
  let fixture: ComponentFixture<JobDescriptionInlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobDescriptionInlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDescriptionInlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
