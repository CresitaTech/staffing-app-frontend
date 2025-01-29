import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddJobEmailTempComponent } from './add-job-email-temp.component';

describe('AddJobEmailTempComponent', () => {
  let component: AddJobEmailTempComponent;
  let fixture: ComponentFixture<AddJobEmailTempComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddJobEmailTempComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddJobEmailTempComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
