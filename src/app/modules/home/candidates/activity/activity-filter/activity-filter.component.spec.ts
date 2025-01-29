import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityFilterComponent } from './activity-filter.component';

describe('ActivityFilterComponent', () => {
  let component: ActivityFilterComponent;
  let fixture: ComponentFixture<ActivityFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivityFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
