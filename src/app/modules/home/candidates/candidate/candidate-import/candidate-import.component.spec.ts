import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateImportComponent } from './candidate-import.component';

describe('CandidateImportComponent', () => {
  let component: CandidateImportComponent;
  let fixture: ComponentFixture<CandidateImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
