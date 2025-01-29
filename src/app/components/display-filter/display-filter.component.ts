import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-display-filter',
  template: `
    <div class="row mb-3" *ngIf="displayFilter && displayFilter.length > 0">
      <div class="col-auto line-height-31">
          <span class="label-value">Advanced Filters:</span>
      </div>
      <div class="col">
        <span *ngFor="let filter of displayFilter">
          <button class="btn btn-sm btn-secondary mb-2 mr-2" type="button" (click)="remove(filter)">
            {{filter | enumConverter | titlecase}}
            <span class="badge badge-light"><i class="fas fa-times"></i></span>
          </button>
        </span>
      </div>
    </div>
  `,
  styles: [`
  .custom-badge {
    background-color: var(--gray);
    color: var(--light);
    padding: 5px 5px;
    margin-right: 5px;
  }
  `]
})
export class DisplayFilterComponent implements OnInit {

  @Input() displayFilter: Array<string>;
  @Output() removeFilter = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

  remove(filter: string): void {
    this.removeFilter.emit(filter);
  }

}
