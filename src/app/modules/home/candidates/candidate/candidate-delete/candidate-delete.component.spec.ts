import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateDeleteComponent } from './candidate-delete.component';

describe('CandidateDeleteComponent', () => {
  let component: CandidateDeleteComponent;
  let fixture: ComponentFixture<CandidateDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
