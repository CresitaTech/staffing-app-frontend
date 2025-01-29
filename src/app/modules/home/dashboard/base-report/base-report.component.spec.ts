import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseReportComponent } from './base-report.component';

describe('BaseReportComponent', () => {
  let component: BaseReportComponent<any>;
  let fixture: ComponentFixture<BaseReportComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BaseReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
