import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEmailListComponent } from './create-email-list.component';

describe('CreateEmailListComponent', () => {
  let component: CreateEmailListComponent;
  let fixture: ComponentFixture<CreateEmailListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateEmailListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEmailListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
