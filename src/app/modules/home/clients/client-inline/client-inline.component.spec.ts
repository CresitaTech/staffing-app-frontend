import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientInlineComponent } from './client-inline.component';

describe('ClientInlineComponent', () => {
  let component: ClientInlineComponent;
  let fixture: ComponentFixture<ClientInlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientInlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientInlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
