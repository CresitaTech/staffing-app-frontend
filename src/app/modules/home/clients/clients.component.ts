import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Constants } from 'src/app/enums/constants.enum';
import { SelectAllService } from './../../../services/common/select-all.service'
import { APIPath } from 'src/app/enums/api-path.enum';
import { Client } from 'src/app/models/client';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { CustomFilterInterface } from 'src/app/models/filters';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Filter } from 'src/app/enums/filter.enum';
import { ClientImportComponent } from './client-import/client-import.component';


@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})

export class ClientsComponent
  extends CustomFilterModel<Client>
  implements OnInit, CustomFilterInterface {
    allNewJobsClient =false;
  api_path = APIPath.CLIENT;

  @ViewChild(FilterComponent) filter: FilterComponent;
  constants = Constants;
  indexAsInput: string;
  eventId: string;

  searchedKeyword: string;


  constructor(
    _api: APIProviderService<Client>,
    private modalService: NgbModal,
    _selectAll: SelectAllService
  ) {
    super(_api, _selectAll);
    this.filterOn.push({
      model: 'total_employee',
      type: Filter.RANGE,
      range: { start: 0, end: 10, param: 'Count' }
    },
      { model: 'first_name' },
      { model: 'last_name' },
      { model: 'primary_skills' },
      { model: 'secondary_skills' },
      { model: 'company_name' });
  }

  ngOnInit(): void {
    this.fetchCollectionList();
    this.allNewJobsClient = true;
  }


  openFilter(): void {
    this.filter.toggle();
  }
  removeFilter(event: string): void {
    this.displayFilter.splice(this.displayFilter.findIndex((el: string) => el === event), 1);
    delete this.filter.filters[event];
    this.filter.sendFilterEvt();
  }


  //select handler to handle- delete, export or Send Mail Actions.
  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    //alert(value);
    if (actionValue === "delete") {
      this.deleteSelectedCollectionItem();

    }
    else alert(actionValue);
  }


  openImportModal() {
    const modalRef = this.modalService.open(ClientImportComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.result.then(res => {
      alert("got it");
    });
  }


  openExport() {
    this.exportItem(APIPath.EXPORT_CLIENT);
  }



  openDeleteUserModel(userId: string): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.id = userId;
    modalRef.componentInstance.title = Constants.CLIENT;
    this.collection.forEach(item => {
      if (item.id === userId) { modalRef.componentInstance.name = item.id; }
    })

    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(userId);
      }
    });
  }



  // Side Filer section
  openFilters() {
    document.getElementById("filters").style.width = "500px";
  }

  closeFilters() {
    document.getElementById("filters").style.width = "0";
  }


  // Side Add Client
  openClient(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
      console.log("***Client Edit" + this.indexAsInput);
    }
    document.getElementById("addClient").style.width = "800px";
  }

  closeClient() {
    document.getElementById("addClient").style.width = "0";
  }


  refreshPage() {
    this.closeClient();
    this.fetchCollectionList();
  }


}
