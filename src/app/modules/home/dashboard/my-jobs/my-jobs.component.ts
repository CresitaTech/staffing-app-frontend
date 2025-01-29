import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-my-jobs',
  template: `
  <div class="modal-header">
  <h5 class="modal-title">My Jobs</h5>
  <button type="button"  class="close" aria-label="Close" (click)="activeModal.dismiss()"> 
    <span aria-hidden="true">&times;</span>
  </button>
</div>
  <div class="col graph">
  <div class="table-responsive">
  
  <div class="example-header mb-2">
  Page Size:
  <select (change)="onPageSizeChanged()" id="page-size">
    <option value="10" selected="">10</option>
    <option value="20">20</option>
    <option value="50">50</option>
    <option value="100">100</option>
    <option value="500">500</option>
    <option value="1000">1000</option>
  </select>
</div>

<ag-grid-angular
style="width: 100%; height: 400px;"
class="ag-theme-alpine"
[rowData]="jobs"
[columnDefs]="columnDefs"
pagination=true
paginationPageSize="10"
(gridReady)="onGridReady($event)"
>
</ag-grid-angular>
</div>
</div>
`,
  styles: [
   ` .example-header {
      font-family: Verdana, Geneva, Tahoma, sans-serif;
      font-size: 13px;
      margin-bottom: 5px;
    }
    `
  ]
})
export class MyJobsComponent implements OnInit {

  @Input() jobs;
  public gridApi;

  
  constructor(
    public activeModal: NgbActiveModal

  ) { }

  ngOnInit(): void {
    console.log(this.jobs);
  }
  

  columnDefs = [
    { headerName: "Assigned Date",     field: "assinged_date",    sortable:true, filter:true},
    { headerName: "Client",            field: "company_name",     sortable:true, filter:true},
    { headerName: "Job Title",         field: "job_title",        sortable:true, filter:true},
    { headerName: "Assigned By",       field: "assignee_name",    sortable:true, filter:true},
    { headerName: "BDM Name",          field: "bdm_name",         sortable:true, filter:true},
    { headerName: "Total Submissions", field: "total_submissions",sortable:true, filter:true},
    { headerName: "Placed",            field: "placed",           sortable:true, filter:true},
    { headerName: "Job Status",        field: "status",           sortable:true, filter:true},

];


onPageSizeChanged() {
  
  var value =(document.getElementById('page-size') as HTMLSelectElement).value
 this.gridApi.paginationSetPageSize(Number(value));
}

onGridReady(params) {
 this.gridApi = params.api;
}

}