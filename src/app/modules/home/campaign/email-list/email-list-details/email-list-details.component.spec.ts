import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailListDetailsComponent } from './email-list-details.component';

describe('EmailListDetailsComponent', () => {
  let component: EmailListDetailsComponent;
  let fixture: ComponentFixture<EmailListDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailListDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailListDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
