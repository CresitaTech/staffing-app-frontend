import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeslotInlineComponent } from './timeslot-inline.component';

describe('TimeslotInlineComponent', () => {
  let component: TimeslotInlineComponent;
  let fixture: ComponentFixture<TimeslotInlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeslotInlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeslotInlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
