import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { EditorChangeContent, EditorChangeSelection } from 'ngx-quill';
declare const $: any;

@Component({
  selector: 'app-template-editor',
  template: `
   <div class="row">
      <div class="col">  
        <input type="text" class="form-control form-control-sm" #editor name="{{id}}"
        #e1="ngModel" [ngModel]="content" (ngModelChange)="onChange($event)" 
        [ngClass]="{ 'is-invalid':e1.invalid && e1.touched }" required />
      </div>
    </div>
    <div *ngIf="hasTags && tags?.length > 0; let last = last;">
      <div class="predefined_values">
        Predefined Values: 
        <a class="badge badge-secondary ml-1" (click)="addToModel(key)" *ngFor="let key of tags">{{key}}</a>
      </div>
    </div>
  `,
  styles: [
  ]
})
export class TemplateEditorComponent implements OnInit {

  @Input() content: string;
  @Input() hasTags: boolean;
  @Input() id?: string;
  @Input() tags?: Array<string>;
  @Output() contentChanged = new EventEmitter<string>();

  @ViewChild('editor') editor: ElementRef;

  constructor() { }

  editorText: string;

  changedEditor(event: EditorChangeContent | EditorChangeSelection) {
    console.log('editor got changed', event);
    this.editorText = event['editor']['root']['innerHTML'];
  }

  ngOnInit(): void {
  }

  onChange(event): void {
    console.log(event);
    this.content = event;
    this.contentChanged.emit(this.content)
  }

  addToModel(value) {
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
