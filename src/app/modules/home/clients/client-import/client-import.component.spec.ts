import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientImportComponent } from './client-import.component';

describe('ClientImportComponent', () => {
  let component: ClientImportComponent;
  let fixture: ComponentFixture<ClientImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
