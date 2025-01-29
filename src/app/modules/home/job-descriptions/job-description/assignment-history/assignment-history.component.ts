import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

@Component({
  selector: 'app-assignment-history',
 template: `
  <div class="modal-header">
  <h5 class="modal-title">Assignment History</h5>
  <div class="col-auto pr-0">
  <a  class="chart-icon btn-link" (click)="downloadFile()" data-tooltip="tooltip"
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
  </select>
</div>

<ag-grid-angular
style="width: 100%; height: 400px;"
class="ag-theme-alpine"
[rowData]="history"
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

export class AssignmentHistoryComponent extends Paging<any> implements OnInit {

  @Input() history;
  @Input() id;
  public gridApi;
  csv_api=APIPath.DOWNLOAD_ASSIGNMENT_HISTORY;
  
  constructor(
    public activeModal: NgbActiveModal,
    _api: APIProviderService<any>,
    _selectAll: SelectAllService,
  ) {
    super(_api,_selectAll)
   }

  ngOnInit(): void {
    this.history.forEach(_ => {
      Object.keys(_).forEach(key=>{
        // && key!=="Candidate Added"
       if(_[key]===null )
          _[key]="--";
        });
      if(_.primary_recruiter_name!=='--'){
        _.primary_recruiter=_.primary_recruiter_name.first_name+" "+_.primary_recruiter_name.last_name;
      }
      else{
        _.primary_recruiter='--'
      }
      if(_.secondary_recruiter_name!=='--'){
        _.secondary_recruiter=_.secondary_recruiter_name.first_name+" "+_.secondary_recruiter_name.last_name;
      }
      else{
        _.secondary_recruiter='--'
      }
      if(_.created_at){
        _.created_at=  _.created_at.split("T")[0];
      }
    });
  }

  downloadFile(){
    this.exportItem(this.csv_api, '&job_id='+this.id);
  }


  columnDefs = [
    { headerName: "Assigned Date",                  field: "created_at",                  sortable:true, filter:true},
    { headerName: "Primary Recruiter Name",         field: "primary_recruiter",         sortable:true, filter:true},
    // { headerName: "Primary Recruiter Email",        field: "primary_recruiter_email",        sortable:true, filter:true},
    { headerName: "Secondary Recruiter Name",       field: "secondary_recruiter",       sortable:true, filter:true},
    // { headerName: "Secondary Recruiter Email",      field: "secondary_recruiter_email",      sortable:true, filter:true},
    { headerName: "Assignee Name",                  field: "assignee_name",                  sortable:true, filter:true},
    // { headerName: "Assignee Email",                 field: "assignee_email",                 sortable:true, filter:true},

];


onPageSizeChanged() {
  
  var value =(document.getElementById('page-size') as HTMLSelectElement).value
 this.gridApi.paginationSetPageSize(Number(value));
}

onGridReady(params) {
 this.gridApi = params.api;
}



}
