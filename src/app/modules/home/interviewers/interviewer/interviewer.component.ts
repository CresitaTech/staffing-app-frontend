import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Client } from 'src/app/models/client';
import { Interviewer } from 'src/app/models/interviewer';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

@Component({
  selector: 'app-interviewer',
  templateUrl: './interviewer.component.html',
  styles: [
  ]
})
export class InterviewerComponent extends Paging<Interviewer>
  implements OnInit {
  api_path = APIPath.INTERVIEWER;

  constants = Constants;
  indexAsInput: string;
  eventId: string;

  searchedKeyword: string;


  constructor(
    _api: APIProviderService<Interviewer>,
    private modalService: NgbModal,
    _selectAll: SelectAllService
  ) {
    super(_api, _selectAll);
  }

  ngOnInit(): void {
    this.fetchCollectionList();
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


  openDeleteUserModel(userId: string): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.id = userId;
    modalRef.componentInstance.title = Constants.INTERVIEWER;
    this.collection.forEach(item => {
      if (item.id === userId) { 
        modalRef.componentInstance.name = `${item.first_name} ${item.last_name}`;
      }
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


  refreshPage() {
    this.closeInterviewer();
    this.fetchCollectionList();
  }



  // Side Add Interviewer
  openInterviewer(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    document.getElementById("addInterviewer").style.width = "800px";
  }

  closeInterviewer() {
    document.getElementById("addInterviewer").style.width = "0";
  }



}
