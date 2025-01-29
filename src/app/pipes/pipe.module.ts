import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumConverterPipe } from './enum-converter/enum-converter.pipe';
import { OrderByDatePipe } from './order-by/order-by-date.pipe';
import { GroupFilterPipe, PermissionFilterPipe, PermissionPipePipe } from './permission-pipe/permission-pipe.pipe';
import { SubmissionPipe } from './submission/submission.pipe';
import { DragDropDirective } from './directives/drag-drop.directive';
import { LimitUptoTwoDIgitsDirective } from './directives/limit-upto-two-digits.directive';
import { JdPrirityPipe } from './jd-priority/jd-pririty.pipe';
import { PasswordMatchDirective } from './directives/password-match.directive';
import { SubmissionDatePipe } from './submission-date.pipe';

@NgModule({
  declarations: [
    EnumConverterPipe, 
    OrderByDatePipe, 
    PermissionPipePipe,
    PermissionFilterPipe,
    GroupFilterPipe,
    SubmissionPipe,
    DragDropDirective,
    LimitUptoTwoDIgitsDirective,
    JdPrirityPipe,
    PasswordMatchDirective,
    SubmissionDatePipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    EnumConverterPipe, 
    OrderByDatePipe, 
    PermissionPipePipe,
    PermissionFilterPipe,
    GroupFilterPipe,
    SubmissionPipe,
    DragDropDirective,
    LimitUptoTwoDIgitsDirective,
    JdPrirityPipe,
    PasswordMatchDirective
  ]
})
export class PipeModule { }