import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDateFilterComponent } from './create-date-filter.component';

describe('CreateDateFilterComponent', () => {
  let component: CreateDateFilterComponent;
  let fixture: ComponentFixture<CreateDateFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateDateFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateDateFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
