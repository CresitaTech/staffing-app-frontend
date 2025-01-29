import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JdassignAddListComponent } from './jdassign-add-list.component';

describe('JdassignAddListComponent', () => {
  let component: JdassignAddListComponent;
  let fixture: ComponentFixture<JdassignAddListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JdassignAddListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JdassignAddListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
