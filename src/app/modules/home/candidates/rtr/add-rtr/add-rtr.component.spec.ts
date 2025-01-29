import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRtrComponent } from './add-rtr.component';

describe('AddRtrComponent', () => {
  let component: AddRtrComponent;
  let fixture: ComponentFixture<AddRtrComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddRtrComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRtrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
