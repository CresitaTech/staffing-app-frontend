import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { QuillViewHTMLComponent } from 'ngx-quill';
import * as Quill from 'quill';

declare const $: any;

@Component({
  selector: 'app-template-editor-body',
  template: `
  

  <div class="row" >
  <div class="col">
  <quill-editor class = "ql-editor" [styles]="{height: '250px'}"   #editor name="{{id}}"
  #e1="ngModel" [ngModel]="content"  (ngModelChange)="onChange($event)" 
  (onEditorCreated)="onEditorCreated($event)" 
  [ngClass]="{ 'is-invalid':e1.invalid && e1.touched }" required 
  > 
  </quill-editor>
  </div>
  </div>

  <!--
  <div class="row">
    <div class="col">
      <textarea type="text" class="form-control form-control-sm" [modules]="editorOptions.editors" #editor name="{{id}}" rows = "8"
      #e1="ngModel" [ngModel]="content" (ngModelChange)="onChange($event)" 
      [ngClass]="{ 'is-invalid':e1.invalid && e1.touched }" required ></textarea>
    </div>
  </div> -->
  <div *ngIf="hasTags && tags?.length > 0; let last = last;">
    <div class="predefined_values">
      Predefined Values: 
      <a class="badge badge-secondary ml-1" (click)="appendTagTo(key)" *ngFor="let key of tags">{{key}}</a>
    </div>
  </div>
`,
  styles: [
  ]
})
export class TemplateEditorBodyComponent implements OnInit {

  @Input() content: string;
  @Input() hasTags: boolean;
  @Input() id?: string;
  @Input() tags?: Array<string>;
  @Output() contentChanged = new EventEmitter<string>();

  @ViewChild('editor') editor: ElementRef;
  @ViewChild('editor') editorD: QuillViewHTMLComponent;

  @ViewChild('editor', { static: true }) editorElementRef: ElementRef;
  editorss: any;


  constructor() { }

  ngOnInit(): void {


    /*this.editorss = new Quill.default(this.editorElementRef.nativeElement, {
      modules: {},
      theme: 'snow'
    });*/
  }

  /*
    private getSelection() {
      //console.log(this.editorss.getSelection())
      return this.editorss.getSelection();
    }
  
    onInsertText(text: string = 'ABCD'): void {
      if (this.getSelection() !== null) {
        this.editorss.insertText(this.getSelection().index, text);
        //  console.log(this.editorss.insertText(this.getSelection().index, text))
      }
    }
  */

  onChange(event): void {
    console.log(event);
    //console.log(event.text);
    this.content = event;
    //this.content = event.text;
    this.contentChanged.emit(this.content)
  }

  public editors;

  //Working
  onEditorCreated(event) {
    this.editors = event;
  }

  appendTagTo(textTOInsert?: string) {
    if (textTOInsert) {
      textTOInsert = '{' + textTOInsert + '}';
      const selection = this.editors.getSelection(true);
      //console.log(selection)
      this.editors.insertText(selection.index, textTOInsert);
      // console.log(this.editors.insertText(selection.index, textTOInsert))
      // this.onChange(this.editors.insertText(selection.index, textTOInsert));
      //this.editor.insertHTML(selection.index, textTOInsert);
    }
  }

  /*appendTagTo(textTOInsert: string) {
    if (textTOInsert) {
      textTOInsert = '{' + textTOInsert + '}';
      const selection = this.editors.getSelection(true);
      console.log(selection)
      this.editors.insertText(selection.index, textTOInsert);
      // console.log(this.editors.insertText(selection.index, textTOInsert))
    }
  }*/

  addToModel(value) {
    console.log(this.editorD);
    let val = (<HTMLTextAreaElement>this.editor.nativeElement).value;
    if (!val) val = '';
    const cursorPos = (<HTMLTextAreaElement>this.editor.nativeElement).selectionStart;
    const textBefore = val.substring(0, cursorPos);
    const textAfter = val.substring(cursorPos, val.length);
    (<HTMLTextAreaElement>this.editor.nativeElement).value = `${textBefore}{${value}}${textAfter}`;
    this.content = (<HTMLTextAreaElement>this.editor.nativeElement).value;
    this.onChange(this.content);
  }

}
