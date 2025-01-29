import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { Constants } from 'src/app/enums/constants.enum';
import { Activity } from 'src/app/models/activity';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { Paging } from 'src/app/classes/paging';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { APIPath } from 'src/app/enums/api-path.enum';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent extends Paging<Activity>
implements OnInit {

  api_path = APIPath.ACTIVITY;
 
  subscription1$: Subscription;
  eventId: string;
  indexAsInput;
  constants = Constants;
  count = 0;
  searchedKeyword: string;

  constructor(
    _api: APIProviderService<Activity>,
    _selectAll:SelectAllService,
    private modalService: NgbModal
     ) { 
    super(_api,_selectAll);
  }

  ngOnInit(): void {
    this.fetchCollectionList();
  }

  openDeleteModel(userId: string): void {
    const modalRef = this.modalService.open(DeleteComponent, { backdrop: 'static', centered: true, keyboard: false, });
    modalRef.componentInstance.id = userId;
    modalRef.componentInstance.title = Constants.ACTIVITY;
    this.collection.forEach(item=>{if(item.id===userId)
      { modalRef.componentInstance.name=(item.candidate_name).first_name;}})
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteActivity(res.id);
      }
    });
  }


  deleteActivity(userId: string) {
    this.deleteCollectionItem(userId);
  }


  openFilters() {
    document.getElementById("filters").style.width = "500px";
  }

  closeFilters() {
    document.getElementById("filters").style.width = "0";
  }


  // Side Add Activity Status
  openAddActivityStatus(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
     
    }
    this.openSidePane("addActivityStatus", 800);
  }


  closeAddActivityStatus() {
    this.closeSidePane("addActivityStatus");
  }


  refreshPage() {
    this.closeAddActivityStatus();
    this.fetchCollectionList();
  }

  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    (actionValue === "delete") ? this.deleteSelectedCollectionItem() : alert(actionValue);
  }


}
