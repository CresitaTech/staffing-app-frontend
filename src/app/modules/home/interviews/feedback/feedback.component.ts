import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Feedback } from 'src/app/models/interviews';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent  extends Paging<Feedback>
implements OnInit, OnDestroy {
  

    api_path = APIPath.FEEDBACK;

    constants = Constants;
    eventId: string;
    indexAsInput;
    searchedKeyword:string
    constructor(
      _api: APIProviderService<Feedback>,
      _selectAll:SelectAllService,
      private modalService: NgbModal,
    ) {
      super(_api, _selectAll)
    }
    ngOnDestroy(): void {
      
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
      modalRef.componentInstance.title = Constants.FEEDBACK;
      this.collection.forEach(item=>{if(item.id===userId)
        { modalRef.componentInstance.name=item.id;}})
      
      modalRef.result.then(res => {
        if (res.result) {
          this.deleteCollectionItem(res.id);
        }
      });
    }
  
  
    refreshPage() {
      this.closeInterviewFeedback();
      this.fetchCollectionList();
    }
  
  
  
    selectHandler() {
      var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
      (actionValue === "delete") ?this.deleteSelectedCollectionItem():alert(actionValue);}
  
  
  
      // Side Interview Feedback
      openInterviewFeedback(event: string, index) {
        this.eventId = event;
       if ((index !== undefined || index !== null) && event === Constants.EDIT) {
       this.indexAsInput = this.collection[index].id;}
        document.getElementById("addInterviewFeedback").style.width = "800px";
    }

    closeInterviewFeedback() {
        document.getElementById("addInterviewFeedback").style.width = "0";
    }

  
    
    openFiltersInterview() {
        document.getElementById("filtersInterview").style.width = "500px";
    }
  
     closeFiltersInterview() {
        document.getElementById("filtersInterview").style.width = "0";
    }
    
}
