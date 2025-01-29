import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BdmJobsComponent } from './bdm-jobs.component';

describe('BdmJobsComponent', () => {
  let component: BdmJobsComponent;
  let fixture: ComponentFixture<BdmJobsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BdmJobsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BdmJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
