import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddActivityInternalComponent } from './add-activity-internal.component';

describe('AddActivityInternalComponent', () => {
  let component: AddActivityInternalComponent;
  let fixture: ComponentFixture<AddActivityInternalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddActivityInternalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddActivityInternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
