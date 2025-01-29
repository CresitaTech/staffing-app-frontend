import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Assignment } from 'src/app/models/assignment-list';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { Paging } from 'src/app/classes/paging';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false }

@Component({
  selector: 'app-assignment-list',
  templateUrl: './assignment-list.component.html',
  styleUrls: ['./assignment-list.component.scss']
})
export class AssignmentListComponent extends Paging<Assignment> implements OnInit {

  api_path = APIPath.JOB_ASSIGNMENT;
  searchedKeyword: string;
  subscription1$: Subscription;
  constants = Constants;
  eventId: string;
  indexAsInput;

  constructor(
    _api: APIProviderService<Assignment>,
    _selectAll: SelectAllService,
    private modalService: NgbModal
  ) {
    super(_api, _selectAll);
  }

  ngOnInit(): void {
    this.fetchCollectionList();
  }


  openDeleteModel(userId: string): void {
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.id = userId;
    modalRef.componentInstance.title = Constants.ASSIGNMENT;
    this.collection.forEach(item => {
      if (item.id === userId) { modalRef.componentInstance.name = item.assignee_name; }
    })

    modalRef.result.then(res => {
      if (res.result) {
        this.deleteAssignment(res.id);
      }
    });
  }


  deleteAssignment(userId: string) {
    this.deleteCollectionItem(userId);
  }



  //delete all the selected cards.
  deleteSelectedLists() {
    this.deleteSelectedCollectionItem();
  }

  // Side Add Job Description Assingment
  openAddJobDescriptionAssignment(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    this.openSidePane('addJobDescriptionAssignment', 800);
  }
  closeAddJobDescriptionAssignment() {
    this.closeSidePane('addJobDescriptionAssignment');
  }


  // Side Filer section
  openFilters() {
    this.openSidePane('filters', 500);
  }
  closeFilters() {
    this.closeSidePane('filters')
  }



  refreshPage() {
    this.closeAddJobDescriptionAssignment();
    this.fetchCollectionList();
  }



  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    (actionValue === "delete") ? this.deleteSelectedLists() : alert(actionValue);
  }


}
