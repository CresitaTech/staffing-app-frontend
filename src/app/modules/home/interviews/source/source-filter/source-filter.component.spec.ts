import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceFilterComponent } from './source-filter.component';

describe('SourceFilterComponent', () => {
  let component: SourceFilterComponent;
  let fixture: ComponentFixture<SourceFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SourceFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SourceFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
