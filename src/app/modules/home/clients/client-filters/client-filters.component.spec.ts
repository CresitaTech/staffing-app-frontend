import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientFiltersComponent } from './client-filters.component';

describe('ClientFiltersComponent', () => {
  let component: ClientFiltersComponent;
  let fixture: ComponentFixture<ClientFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
