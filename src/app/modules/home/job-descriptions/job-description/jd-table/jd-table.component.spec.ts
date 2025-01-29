import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JdTableComponent } from './jd-table.component';

describe('JdTableComponent', () => {
  let component: JdTableComponent;
  let fixture: ComponentFixture<JdTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JdTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JdTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
