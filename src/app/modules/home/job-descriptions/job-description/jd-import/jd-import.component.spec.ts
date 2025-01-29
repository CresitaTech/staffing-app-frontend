import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JdImportComponent } from './jd-import.component';

describe('JdImportComponent', () => {
  let component: JdImportComponent;
  let fixture: ComponentFixture<JdImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JdImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JdImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
