import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddJobCustomFieldsComponent } from './add-job-custom-fields.component';

describe('AddJobCustomFieldsComponent', () => {
  let component: AddJobCustomFieldsComponent;
  let fixture: ComponentFixture<AddJobCustomFieldsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddJobCustomFieldsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddJobCustomFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
