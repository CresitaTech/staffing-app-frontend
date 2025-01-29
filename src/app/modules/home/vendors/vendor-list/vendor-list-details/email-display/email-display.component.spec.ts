import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailDisplayComponent } from './email-display.component';

describe('EmailDisplayComponent', () => {
  let component: EmailDisplayComponent;
  let fixture: ComponentFixture<EmailDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
