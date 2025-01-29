import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Designation } from 'src/app/models/designation';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { DesignationService } from 'src/app/services/designation/designation.service';
import { DesignationDeleteComponent } from '../designation-delete/designation-delete.component';

@Component({
  selector: 'app-designation-list',
  templateUrl: './designation-list.component.html',
  styles: []
})
export class DesignationListComponent extends Paging<Designation> implements OnInit, OnDestroy {

  api_path = APIPath.DESIGNATION;

  eventId: string;
  indexAsInput;
  Constants = Constants;

  constructor(
    // private designationService: DesignationService,
    public modalService: NgbModal,
    _api: APIProviderService<Designation>,
    _selectAll: SelectAllService
  ) { super(_api, _selectAll) }

  ngOnDestroy(): void {
    this.unsubscribeDeleteSub();
    if (this.fetchSub) this.fetchSub.unsubscribe();
  }


  ngOnInit(): void {
    this.fetchCollectionList();
  }

  

  // Side Filer section
  openFilters() {
    this.openSidePane("filters", 500);
  }

  closeFilters() {
    this.closeSidePane('filters');
  }


  // Side Add designation
  openDesignation(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    this.openSidePane('addDesignation', 800)
  }

  closeDesignation() {
    this.closeSidePane('addDesignation');
  }


  refreshPage() {
    this.indexAsInput = undefined;
    this.fetchCollectionList()
    this.closeDesignation();
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



  openDeleteModal(designation: Designation) {
    const modalRef = this.modalService.open(DesignationDeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.designation = designation;
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }

}
