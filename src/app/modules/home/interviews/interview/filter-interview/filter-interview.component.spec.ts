import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterInterviewComponent } from './filter-interview.component';

describe('FilterInterviewComponent', () => {
  let component: FilterInterviewComponent;
  let fixture: ComponentFixture<FilterInterviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterInterviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
