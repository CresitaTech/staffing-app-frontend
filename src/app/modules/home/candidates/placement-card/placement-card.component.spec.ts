import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlacementCardComponent } from './placement-card.component';

describe('PlacementCardComponent', () => {
  let component: PlacementCardComponent;
  let fixture: ComponentFixture<PlacementCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlacementCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlacementCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
