import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignationDeleteComponent } from './designation-delete.component';

describe('DesignationDeleteComponent', () => {
  let component: DesignationDeleteComponent;
  let fixture: ComponentFixture<DesignationDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DesignationDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesignationDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
