import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BdmPerformanceComponent } from './bdm-performance.component';

describe('BdmPerformanceComponent', () => {
  let component: BdmPerformanceComponent;
  let fixture: ComponentFixture<BdmPerformanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BdmPerformanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BdmPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
