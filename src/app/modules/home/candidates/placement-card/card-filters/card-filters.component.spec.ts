import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardFiltersComponent } from './card-filters.component';

describe('CardFiltersComponent', () => {
  let component: CardFiltersComponent;
  let fixture: ComponentFixture<CardFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
