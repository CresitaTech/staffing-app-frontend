import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CKEditor5, CKEditorComponent } from '@ckeditor/ckeditor5-angular';
import CKSource from './../../../ckeditor5/ckeditor';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
  selector: 'app-editor',
  template: `
    <ckeditor 
      [editor]="Editor" 
      [config]="config" 
      tagName="textarea" 
      [(ngModel)]="content"
      (ngModelChange)="onChange($event)" 
      #custom_editor></ckeditor>
    <div *ngIf="hasTags && tags?.length > 0; let last = last;">
      <div class="predefined_values">
        Predefined Values: 
        <a class="badge badge-secondary ml-1" (click)="addToModel(key)" *ngFor="let key of tags">{{key}}</a>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ck-editor__editable {
      min-height: 200px !important;
    }
  `]
})
export class EditorComponent implements OnInit {

  @ViewChild('custom_editor') editorComponent: CKEditorComponent;
  // public Editor = CKSource.Editor;
  public Editor = ClassicEditor;

  @Input() content: string;
  @Input() hasTags: boolean;
  @Input() readOnly: boolean = false;
  @Input() id?: string;
  @Input() tags?: Array<string>;
  @Output() contentChanged = new EventEmitter<string>();

  config = {
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'underline',
        'link',
        'bulletedList',
        'numberedList',
        '|',
        'alignment',
        'indent',
        'outdent',
        '|',
        'fontSize',
        'fontFamily',
        'strikethrough',
        'subscript',
        'superscript',
        'imageUpload',
        'blockQuote',
        'insertTable',
        'mediaEmbed',
        'undo',
        'redo',
        'codeBlock',
        'highlight',
        'horizontalLine',
        'specialCharacters'
      ]
    },
    language: 'en',
    image: {
      toolbar: [
        'imageTextAlternative',
        'imageStyle:full',
        'imageStyle:side'
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableCellProperties'
      ]
    },
    licenseKey: '',
  }

  constructor() {
    // if(this.readOnly){
    //   this.Editor.isReadOnly = true;
    // }
   }

  ngOnInit(): void {
    console.log("app-editor ngOnInit");
    
  }

  onChange(event): void {
    const editorInstance = this.Editor;
    if (editorInstance) {
      this.content = this.editorComponent.editorInstance.getData();
      console.log(this.content); // You can use data as needed (e.g., save it to a database)
    }
    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    // this.content = event;
    this.contentChanged.emit(this.content)
  }

  addToModel(key) {
    const range = this.getEditor().model.document.selection._selection._ranges[0];
    if (range) {
      const startPos = range.start.path[1];
      const endPos = range.end.path[1];
      this.content = this.content.substr(0, startPos) + `{${key}}` + this.content.substr(endPos);
    } else {
      this.content = `${this.content ? this.content : ''}{${key}}`
    }
  }

  getEditor(): CKEditor5.Editor {
    return this.editorComponent.editorInstance;
  }

}
