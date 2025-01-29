import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-unassigned-jobs',
  template: `
  <div class="modal-header">
  <h5 class="modal-title" *ngIf="toDisplay==='job'">Unassigned Jobs</h5>
  <h5 class="modal-title" *ngIf="toDisplay==='client'">Clients Summary</h5>
  <div class="col-auto text-right">
  <a  class="chart-icon btn-link" *ngIf="toDisplay==='job'" (click)="downloadFile(toDisplay)" data-tooltip="tooltip"
  data-placement="bottom" title="Download CSV" >
  <i class="fas fa-file-excel excel-modal"></i>
  </a>
  <button type="button"  class="close2" aria-label="Close" (click)="activeModal.dismiss()"> 
    <span aria-hidden="true">&times;</span>
  </button>
  </div>
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

<ag-grid-angular *ngIf="toDisplay==='job'"
style="width: 100%; height: 400px;"
class="ag-theme-alpine"
[rowData]="jobs"
[columnDefs]="columnDefs"
pagination=true
paginationPageSize="10"
(gridReady)="onGridReady($event)"
>
</ag-grid-angular>

<ag-grid-angular *ngIf="toDisplay==='client'"
style="width: 100%; height: 400px;"
class="ag-theme-alpine"
[rowData]="clients"
[columnDefs]="columnDefsForClients"
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
export class UnassignedJobsComponent implements OnInit {

  @Input() jobs;
  @Input() clients;
  @Input() toDisplay;
  public gridApi;
  csv_api = '/reports/get_unasssigned_jobs_csv/';
  csv_api_client='/reports/export_top_clients/';
  
  constructor(
    public activeModal: NgbActiveModal,
    private _api: APIProviderService<any>

  ) { }

  ngOnInit(): void {
  }


  columnDefs = [
    { headerName: "Job Title",     field: "job_title",  width:350,  sortable:true, filter:true},
    { headerName: "Company Name",  field: "company_name", width:250,    sortable:true, filter:true},
    { headerName: "Posted Date",  field: "posted_date",   width:250,  sortable:true, filter:true},
];




columnDefsForClients = [
  { headerName: "Client name",     field: "client_name",  width:350,  sortable:true, filter:true},
  { headerName: "Client Country", field: "country", sortable: true, filter: true },
  { headerName: "Jobs",  field: "job_title", width:250,    sortable:true, filter:true},
  { headerName: "Submissions",  field: "submissions",   width:250,  sortable:true, filter:true},
  { headerName: "Placed",  field: "placed",   width:250,  sortable:true, filter:true},

];

onPageSizeChanged() {
  
  var value =(document.getElementById('page-size') as HTMLSelectElement).value
 this.gridApi.paginationSetPageSize(Number(value));
}

onGridReady(params) {
 this.gridApi = params.api;
}


downloadFile(toDisplay): void {
  var api_export;
  if(toDisplay=='client'){
   api_export=this.csv_api_client;
  }
  else{
  api_export= this.csv_api;
  }
  this._api
    .getReportWithApiLink(`${api_export}`, 'text')
    .subscribe(res => {
      var downloadLink = document.createElement("a");
      var blob = new Blob(["\ufeff", res]);
      var url = URL.createObjectURL(blob);
      downloadLink.href = url;
      if(toDisplay=='client'){
      downloadLink.download = "client-list"+".csv";
      }
      else{
      downloadLink.download = "unAssigned-list"+".csv";
      }
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });
}



}
