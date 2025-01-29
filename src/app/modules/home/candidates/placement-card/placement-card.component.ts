import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { Constants } from 'src/app/enums/constants.enum';
import { Paging } from 'src/app/classes/paging';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { APIPath } from 'src/app/enums/api-path.enum';
import { PlacementCard } from 'src/app/models/placement-card';
import { SelectAllService } from 'src/app/services/common/select-all.service';

@Component({
  selector: 'app-placement-card',
  templateUrl: './placement-card.component.html',
  styleUrls: ['./placement-card.component.scss']
})
export class PlacementCardComponent extends Paging<PlacementCard>
implements OnInit {
 
  api_path = APIPath.PLACEMENT;
  
  searchedKeyword: string;
  subscription1$: Subscription;
  constants = Constants;
  eventId: string;
  indexAsInput;
  
  
  constructor(
     _api: APIProviderService<PlacementCard>,
    _selectAll:SelectAllService,
    private modalService:NgbModal
  ) {
    super(_api,_selectAll);
  }

  ngOnInit(): void {
    this.fetchCollectionList();

  }




  openDeleteModel(userId: string): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });
    modalRef.componentInstance.id = userId;
    modalRef.componentInstance.title = Constants.CARD;
    this.collection.forEach(item=>{if(item.id===userId)
      { modalRef.componentInstance.name=item.id;}})
    
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }



  // Side Add Placement Card
  openPlacementCard(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
      // console.log("*********index**********"+this.indexAsInput)
    }
    document.getElementById("addPlacementCard").style.width = "800px";
  }



  closePlacementCard() {
    document.getElementById("addPlacementCard").style.width = "0";
  }



  // Side Filer section
  openFilters() {
    document.getElementById("filters").style.width = "500px";
  }



  closeFilters() {
    document.getElementById("filters").style.width = "0";
  }

  

  refreshPage() {
    this.closePlacementCard();
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
