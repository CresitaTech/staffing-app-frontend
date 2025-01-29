import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RtrComponent } from './rtr.component';

describe('RtrComponent', () => {
  let component: RtrComponent;
  let fixture: ComponentFixture<RtrComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RtrComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RtrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
