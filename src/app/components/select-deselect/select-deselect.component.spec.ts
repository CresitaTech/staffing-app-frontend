import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectDeselectComponent } from './select-deselect.component';

describe('SelectDeselectComponent', () => {
  let component: SelectDeselectComponent;
  let fixture: ComponentFixture<SelectDeselectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectDeselectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectDeselectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
