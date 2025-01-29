import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Submission } from 'src/app/models/submission-list';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { Paging } from 'src/app/classes/paging';
@Component({
  selector: 'app-submission-list',
  templateUrl: './submission-list.component.html',
  styleUrls: ['./submission-list.component.scss']
})
export class SubmissionListComponent extends Paging<Submission>
  implements OnInit {
  
    api_path = APIPath.JOB_SUBMISSION;
    searchedKeyword: string;
    constants = Constants;
    eventId: string;
    indexAsInput;
    subscription1$: Subscription;
  
  
    constructor(
      _api: APIProviderService<Submission>,
      _selectAll:SelectAllService,
      private modalService:NgbModal
    ) {
      super(_api,_selectAll)
    }
  
    ngOnInit(): void {
      this.fetchCollectionList();
    }
  
  
    deleteSubmission(userId: string) {
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
        { modalRef.componentInstance.name=item.candidate_name.first_name;}})
      
      modalRef.result.then(res => {
        if (res.result) {
          this.deleteSubmission(res.id);
        }
      });
    }
  
  
    // Side Add RTR
    openAddJobDescriptionSubmission(event: string, index) {
      this.eventId = event;
      if ((index !== undefined || index !== null) && event === Constants.EDIT) {
        this.indexAsInput = this.collection[index].id;
      }
      console.log(event)
      document.getElementById("addJobDescriptionSubmission").style.width = "800px";
    }
  
    closeAddJobDescriptionSubmission() {
      document.getElementById("addJobDescriptionSubmission").style.width = "0";
    }
  
    // Side Filter section
    openFilters() {
      document.getElementById("filters").style.width = "500px";
    }
  
    closeFilters() {
      document.getElementById("filters").style.width = "0";
    }
  
  
    refreshPage() {
      this.closeAddJobDescriptionSubmission();
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
