import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { Constants } from 'src/app/enums/constants.enum';
import { Rtr } from 'src/app/models/rtr';
import { Paging } from 'src/app/classes/paging';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { APIPath } from 'src/app/enums/api-path.enum';

@Component({
  selector: 'app-rtr',
  templateUrl: './rtr.component.html',
  styleUrls: ['./rtr.component.scss']
})
export class RtrComponent extends Paging<Rtr>
implements OnInit {

  api_path = APIPath.RTR;
  searchedKeyword: string;
  constants = Constants;
  eventId: string;
  indexAsInput;
  subscription1$: Subscription;
  count = 0;

  constructor(
    _api: APIProviderService<Rtr>,
    _selectAll:SelectAllService,
    private modalService:NgbModal
  ) {
    super(_api,_selectAll)
  }

  ngOnInit(): void {
    this.fetchCollectionList();
  }


  deleteRtr(userId: string) {
    this.deleteCollectionItem(userId);
  }

  openDeleteModel(userId: string): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.id = userId;
    modalRef.componentInstance.title = Constants.RTR;
    this.collection.forEach(item=>{if(item.id===userId)
      { modalRef.componentInstance.name=item.id;}})
    
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }


  // Side Add RTR
  openAddRTR(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    console.log(event)
    document.getElementById("addRTR").style.width = "800px";
  }

  closeAddRTR() {
    document.getElementById("addRTR").style.width = "0";
  }

  // Side Filter section
  openFilters() {
    document.getElementById("filters").style.width = "500px";
  }

  closeFilters() {
    document.getElementById("filters").style.width = "0";
  }


  refreshPage() {
    this.closeAddRTR();
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

  
}
