import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { User } from 'src/app/models/user';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false }

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent extends Paging<User> implements OnInit {

  api_path = APIPath.USERS
  sort = '-date_joined';

  indexAsInput
  constants = Constants;
  eventId: Constants;

  constructor(
    _api: APIProviderService<User>,
    _selectAll: SelectAllService,
    private modalService: NgbModal,
  ) {
    super(_api, _selectAll);
  }

  ngOnInit(): void {
    this.fetchCollectionList()
  }

  openFilers() { }


  refreshPage(event: { isActionRequired: boolean, elementId: string }) {
    this.closeSidePane(event.elementId);
    if (!event.isActionRequired) {
      this.fetchCollectionList();
      return;
    }
  }


  closeDetail() {
    this.closeSidePane('addUser');
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



  openDetail(event: Constants, index: number) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    this.openSidePane('addUser', 800);

  }



  deleteUser(user: User) {
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.id = user.id;
    modalRef.componentInstance.title = Constants.USER;
    this.collection.forEach(item => {
      if (item.id === user.id) {
        modalRef.componentInstance.name = `${item.first_name} ${item.last_name}`;
      }
    })
    modalRef.result.then(res => {
      if (res.result) this.deleteCollectionItem(res.id);
    });
  }

}
