import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateRepositoryComponent } from './candidate-repository.component';

describe('CandidateRepositoryComponent', () => {
  let component: CandidateRepositoryComponent;
  let fixture: ComponentFixture<CandidateRepositoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateRepositoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateRepositoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
