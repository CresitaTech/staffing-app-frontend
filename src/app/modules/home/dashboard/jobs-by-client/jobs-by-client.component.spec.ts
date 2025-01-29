import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsByClientComponent } from './jobs-by-client.component';

describe('JobsByClientComponent', () => {
  let component: JobsByClientComponent;
  let fixture: ComponentFixture<JobsByClientComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobsByClientComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsByClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
