import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Paging } from 'src/app/classes/paging';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { CandidateRepository } from 'src/app/models/candidate-repository';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';

@Component({
  selector: 'app-candidate-repository',
  templateUrl: './candidate-repository.component.html',
  styleUrls: ['./candidate-repository.component.scss']
})
export class CandidateRepositoryComponent
  extends Paging<CandidateRepository>
  implements OnInit, OnDestroy {

  api_path = APIPath.CANDIDATE_REPO;
  searchedKeyword: string;
  constants = Constants;
  eventId: string;
  indexAsInput;

  constructor(
    service: APIProviderService<CandidateRepository>,
    selectAllService: SelectAllService,
    private modalService: NgbModal
  ) {
    super(service, selectAllService);
  }

  ngOnInit(): void {
    this.fetchCollectionList();
  }

  ngOnDestroy(): void {

  }


  openDeleteModel(userId: string): void {
    const modalRef = this.modalService.open(DeleteComponent,
      { backdrop: 'static', centered: true, keyboard: false, });

    modalRef.componentInstance.id = userId;
    modalRef.componentInstance.title = Constants.REPOSITORY;
    this.collection.forEach(item => {
      if (item.id === userId) { modalRef.componentInstance.name = item.id; }
    })
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }


  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    (actionValue === "delete") ? this.deleteSelectedLists() : alert(actionValue);
  }


  //delete all the selected 
  deleteSelectedLists() {
    this.deleteSelectedCollectionItem();
  }


  refreshPage() {
    this.closeAddCandidateRepositery();  //Close Repository
    this.fetchCollectionList();
  }


  // Side Add Add Candidate Repositery
  openAddCandidateRepositery(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    document.getElementById("addCandidateRepositery").style.width = "800px";
  }


  closeAddCandidateRepositery() {
    document.getElementById("addCandidateRepositery").style.width = "0";
  }


}
