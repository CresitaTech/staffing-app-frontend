import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Client } from 'src/app/models/client';
import { CustomDetailFilter, CustomDetailFilterInterface } from 'src/app/classes/custom-detail-filter';

@Component({
  selector: 'app-client-filters',
  templateUrl: './client-filters.component.html',
  styleUrls: ['./client-filters.component.scss'],
})
export class ClientFiltersComponent extends CustomDetailFilter implements OnInit, CustomDetailFilterInterface {

  @Input() items: Array<Client>;
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
    console.log(this.selectedFilter);
    
    this.filterEvt.emit(this.selectedFilter);
  }

}
