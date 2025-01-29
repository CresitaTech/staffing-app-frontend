import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateEditorBodyComponent } from './template-editor-body.component';

describe('TemplateEditorBodyComponent', () => {
  let component: TemplateEditorBodyComponent;
  let fixture: ComponentFixture<TemplateEditorBodyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TemplateEditorBodyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateEditorBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
