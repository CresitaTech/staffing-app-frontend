import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Group } from 'src/app/models/group';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false }

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent extends Paging<Group> implements OnInit {

  api_path = APIPath.GROUP;
  constants = Constants;
  eventId: Constants;
  indexAsInput: number | string;

  constructor(
    _api: APIProviderService<Group>,
    _selectAll: SelectAllService,
    private modalService: NgbModal
  ) { super(_api, _selectAll); }

  ngOnInit(): void {
    this.fetchCollectionList()
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


  refreshPage(event: { isActionRequired: boolean, elementId: string }) {
    this.closeSidePane(event.elementId);
    if (!event.isActionRequired) {
      this.fetchCollectionList();
      return;
    }
  }

  
  
  openGroup(event: Constants, index: number) {
    this.formClose = false;
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    this.openSidePane('addGroup', 800);
  }



  deleteGroup(group: Group) {
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.id = group.id;
    modalRef.componentInstance.title = Constants.GROUP;
    this.collection.forEach(item => {
      if (item.id === group.id) { modalRef.componentInstance.name = item.name; }
    })
    modalRef.result.then(res => {
      if (res.result) this.deleteCollectionItem(res.id);
    });
  }

}
