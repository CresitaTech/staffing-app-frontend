import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayFilterComponent } from './display-filter.component';

describe('DisplayFilterComponent', () => {
  let component: DisplayFilterComponent;
  let fixture: ComponentFixture<DisplayFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
