import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentHistoryComponent } from './assignment-history.component';

describe('AssignmentHistoryComponent', () => {
  let component: AssignmentHistoryComponent;
  let fixture: ComponentFixture<AssignmentHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
