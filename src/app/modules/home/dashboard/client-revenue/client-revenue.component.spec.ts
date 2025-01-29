import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientRevenueComponent } from './client-revenue.component';

describe('ClientRevenueComponent', () => {
  let component: ClientRevenueComponent;
  let fixture: ComponentFixture<ClientRevenueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientRevenueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientRevenueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
