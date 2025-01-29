import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobDescriptionDetailsDialogComponent } from './job-description-details-dialog.component';

describe('JobDescriptionDetailsDialogComponent', () => {
  let component: JobDescriptionDetailsDialogComponent;
  let fixture: ComponentFixture<JobDescriptionDetailsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobDescriptionDetailsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDescriptionDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
