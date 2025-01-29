import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CustomDetailFilter, CustomDetailFilterInterface } from 'src/app/classes/custom-detail-filter';
import { EmailTemplate } from 'src/app/models/email-template';

@Component({
  selector: 'app-template-filter',
  templateUrl: './template-filter.component.html',
  styleUrls: ['./template-filter.component.scss']
})
export class TemplateFilterComponent extends CustomDetailFilter implements OnInit, CustomDetailFilterInterface {

  @Input() items: Array<EmailTemplate>;
  @Input() params: Array<string>;
  @Output() filterEvt = new EventEmitter<Object>();

  constructor() { super() }

  ngOnInit(): void {
    this.createFilter(this.params, this.items)
  }

  clearFilters() {
    this.selectedFilter = {};
    this.applyFilters();
  }

  applyFilters() {
    this.filterEvt.emit(this.selectedFilter);
  }

}
