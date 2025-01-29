import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateInlineComponent } from './candidate-inline.component';

describe('CandidateInlineComponent', () => {
  let component: CandidateInlineComponent;
  let fixture: ComponentFixture<CandidateInlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateInlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateInlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
