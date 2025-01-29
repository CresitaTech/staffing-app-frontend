import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobDescriptionNotesComponent } from './job-description-notes.component';

describe('JobDescriptionNotesComponent', () => {
  let component: JobDescriptionNotesComponent;
  let fixture: ComponentFixture<JobDescriptionNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobDescriptionNotesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDescriptionNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
