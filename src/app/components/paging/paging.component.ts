import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-paging',
  template: `
    <div class="row mt-2 paging-section">
      <div class="col-md-6 col-sm-12">
        <div class="text-muted showing-entries">Showing {{collectionSize !== 0 ? ((page-1)*limit) + 1 : 0}} to {{(collectionSize < limit ||
            collectionSize < page * limit) ? collectionSize : page * limit}} of {{collectionSize}} entries</div>
        </div>
        <div class="col-auto ml-auto">
          <ngb-pagination [collectionSize]="collectionSize" [(page)]="page" [pageSize]="limit" [maxSize]="5" [rotate]="true"
            [ellipses]="false" [boundaryLinks]="true" (pageChange)="changePage($event)">
          </ngb-pagination>
        </div>
      </div>
  `,
  styles: ['']
})
export class PagingComponent implements OnInit {

  @Input() page: number;
  @Input('pageSize') limit: number;
  @Input() collectionSize: number;
  @Output() pageChangeEvt = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
    console.log("ngOnInit PagingComponent");
  }

  changePage(page) {
    this.pageChangeEvt.emit(page);
  }

}
