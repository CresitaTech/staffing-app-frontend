import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CustomDetailFilter, CustomDetailFilterInterface } from 'src/app/classes/custom-detail-filter';
import { Activity } from 'src/app/models/activity';

@Component({
  selector: 'app-activity-filter',
  templateUrl: './activity-filter.component.html',
  styleUrls: ['./activity-filter.component.scss']
})
export class ActivityFilterComponent extends CustomDetailFilter implements OnInit, CustomDetailFilterInterface {

  @Input() items: Array<Activity>;
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