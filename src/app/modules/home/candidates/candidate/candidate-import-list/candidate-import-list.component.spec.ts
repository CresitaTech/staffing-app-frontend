import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateImportListComponent } from './candidate-import-list.component';

describe('CandidateImportListComponent', () => {
  let component: CandidateImportListComponent;
  let fixture: ComponentFixture<CandidateImportListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateImportListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateImportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
