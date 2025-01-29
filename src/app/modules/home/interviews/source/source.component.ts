import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Source } from 'src/app/models/interviews';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

@Component({
  selector: 'app-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss']
})


export class SourceComponent extends Paging<Source>
implements OnInit {
  
  api_path = APIPath.SOURCE;
  searchedKeyword: string;
  constants = Constants;
  eventId: string;
  indexAsInput;
  subscription1$: Subscription;
  count = 0;

  constructor(
    _api: APIProviderService<Source>,
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
        this.deleteRtr(res.id);
      }
    });
  }

  refreshPage() {
    this.closeAddInterviewMode();
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


     // Side Add Interview Mode
     openAddInterviewMode(event: string, index) {
      this.eventId = event;
      if ((index !== undefined || index !== null) && event === Constants.EDIT) {
        this.indexAsInput = this.collection[index].id;
      }
      document.getElementById("addInterviewMode").style.width = "800px";
  }

   closeAddInterviewMode() {
      document.getElementById("addInterviewMode").style.width = "0";
  }

}
