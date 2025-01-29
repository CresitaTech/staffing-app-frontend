import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOfferLetterComponent } from './add-offer-letter.component';

describe('AddOfferLetterComponent', () => {
  let component: AddOfferLetterComponent;
  let fixture: ComponentFixture<AddOfferLetterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddOfferLetterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOfferLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
