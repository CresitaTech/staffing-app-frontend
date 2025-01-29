import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { Interview } from 'src/app/models/interviews';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { Paging } from 'src/app/classes/paging';

@Component({
  selector: 'app-interview',
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.scss']
})
export class InterviewComponent
  extends Paging<Interview>
  implements OnInit, OnDestroy {

  api_path = APIPath.INTERVIEW;
  searchedKeyword: string;


  constants = Constants;
  eventId: string;
  indexAsInput;

  constructor(
    _api: APIProviderService<Interview>,
    _selectAll: SelectAllService,
    private modalService: NgbModal,
  ) {
    super(_api, _selectAll);
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
    modalRef.componentInstance.title = Constants.INTERVIEW;
    this.collection.forEach(item => {
      if (item.id === userId) { modalRef.componentInstance.name = item.id; }
    })

    modalRef.result.then(res => {
      if (res.result) {
        this.deleteCollectionItem(res.id);
      }
    });
  }

  getInterviewerName(data: any) {
    if (!data)
      return "";
    var interviewerName = "";
    for (let i = 0; i < data.length; i++) {
      interviewerName += (data[i].first_name == "Other" ? data[i].primary_email : (data[i].first_name +" "+ data[i].last_name)) + ",\n";
    }
    return interviewerName.length > 0 ? interviewerName.substring(0, interviewerName.length - 2) : "";
  }


  refreshPage() {
    this.closeAddInterview();
    this.fetchCollectionList();
  }



  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    (actionValue === "delete") ? this.deleteSelectedCollectionItem() : alert(actionValue);
  }



  openInterviewFeedback() {
  }

  openInterviewCancel() {
  }



  openFiltersInterview() {
    document.getElementById("filtersInterview").style.width = "500px";
  }

  closeFiltersInterview() {
    document.getElementById("filtersInterview").style.width = "0";
  }


  openAddInterview(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    document.getElementById("addInterview").style.width = "800px";
  }

  closeAddInterview() {
    document.getElementById("addInterview").style.width = "0";
  }


  openInterviewReschedule() {
    document.getElementById("interviewReschedule").style.width = "800px";
  }

  closeInterviewReschedule() {
    document.getElementById("interviewReschedule").style.width = "0";
  }


}
