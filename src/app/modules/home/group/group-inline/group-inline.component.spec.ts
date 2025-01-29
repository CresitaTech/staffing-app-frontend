import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupInlineComponent } from './group-inline.component';

describe('GroupInlineComponent', () => {
  let component: GroupInlineComponent;
  let fixture: ComponentFixture<GroupInlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupInlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupInlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
