import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEmailTempComponent } from './add-email-temp.component';

describe('AddEmailTempComponent', () => {
  let component: AddEmailTempComponent;
  let fixture: ComponentFixture<AddEmailTempComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddEmailTempComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEmailTempComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
