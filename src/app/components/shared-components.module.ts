import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { PipeModule } from "../pipes/pipe.module";

import { PagingComponent } from "./paging/paging.component";
import { EditorComponent } from './editor/editor.component';
import { DisplayFilterComponent } from './display-filter/display-filter.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { CreateDateFilterComponent, FilterFooter, FilterHeader } from './create-date-filter/create-date-filter.component';
import { DeleteComponent } from './delete/delete.component';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';

import { FilterComponent, MinMaxRange } from './filter/filter.component';
import { SelectDeselectComponent } from './select-deselect/select-deselect.component';
import { TemplateEditorComponent } from './template-editor/template-editor.component';
import { DocViewerComponent } from './doc-viewer/doc-viewer.component';
import { NgxDocViewerModule } from "ngx-doc-viewer";
import { EmailSettingComponent } from './email-setting/email-setting.component';
import { ReadMoreComponent } from './read-more/read-more.component';
import { TemplateEditorBodyComponent } from './template-editor/template-editor-body/template-editor-body.component';
import { QuillModule } from "ngx-quill";


@NgModule({
    declarations: [
        PagingComponent,
        EditorComponent,
        DisplayFilterComponent,
        CreateDateFilterComponent,
        FilterHeader,
        FilterFooter,
        DeleteComponent,
        InfoDialogComponent,
        FilterComponent,
        SelectDeselectComponent,
        MinMaxRange,
        TemplateEditorComponent,
        DocViewerComponent,
        EmailSettingComponent,
        ReadMoreComponent,
        TemplateEditorBodyComponent,

    ],
    imports: [
        CommonModule,
        NgbModule,
        FormsModule,
        PipeModule,
        CKEditorModule,
        NgxDocViewerModule,
        QuillModule
    ],
    exports: [
        PagingComponent,
        EditorComponent,
        DisplayFilterComponent,
        CreateDateFilterComponent,
        FilterHeader,
        FilterFooter,
        DeleteComponent,
        FilterComponent,

        SelectDeselectComponent,
        MinMaxRange,
        TemplateEditorComponent,
        TemplateEditorBodyComponent,
        DocViewerComponent,
        ReadMoreComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }