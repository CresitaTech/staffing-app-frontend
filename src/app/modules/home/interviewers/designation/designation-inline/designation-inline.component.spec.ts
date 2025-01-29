import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignationInlineComponent } from './designation-inline.component';

describe('DesignationInlineComponent', () => {
  let component: DesignationInlineComponent;
  let fixture: ComponentFixture<DesignationInlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DesignationInlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesignationInlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
