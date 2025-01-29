import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { Constants } from 'src/app/enums/constants.enum';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { Paging } from 'src/app/classes/paging';
import { EmailTemplate } from 'src/app/models/email-template';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-email-template',
  templateUrl: './email-template.component.html',
  styleUrls: ['./email-template.component.scss']
})
export class EmailTemplateComponent extends Paging<EmailTemplate>
implements OnInit {
  api_path = APIPath.EMAIL_TEMPLATE;

  searchedKeyword: string;
  subscription1$: Subscription;
  eventId: string;
  indexAsInput;
  constants = Constants;
  count: number = 0;

  constructor(
     _api: APIProviderService<EmailTemplate>,
     _selectAll: SelectAllService,
    private modalService:NgbModal,
     router:Router
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
    modalRef.componentInstance.title = Constants.EMAIL_TEMPLATE;
    this.collection.forEach(item=>{if(item.id===userId)
      { modalRef.componentInstance.name=item.id;}})
    
    modalRef.result.then(res => {
      if (res.result) {
        this.deleteTemplate(res.id);
      }
    });
  }


  deleteTemplate(userId: string) {
   this.deleteCollectionItem(userId);
  }


  // Side Filer section
  openFilters() {
    document.getElementById("filters").style.width = "500px";
  }

  closeFilters() {
    document.getElementById("filters").style.width = "0";
  }



  // Side Add Email Template
  openEmailTemplate(event: string, index) {
    this.eventId = event;
    if ((index !== undefined || index !== null) && event === Constants.EDIT) {
      this.indexAsInput = this.collection[index].id;
    }
    document.getElementById("addEmailTemplate").style.width = "800px";
  }

  closeEmailTemplate() {
    document.getElementById("addEmailTemplate").style.width = "0";
  }

 

  refreshPage() {
    this.closeEmailTemplate();
    this.fetchCollectionList();
  }
  


  selectHandler() {
    var actionValue = (document.getElementById('actionType') as HTMLSelectElement).value;
    (actionValue === "delete") ? this.deleteSelectedLists() : alert(actionValue);
  }

  //delete all the selected 
  deleteSelectedLists() {
    this.collection.forEach(
      item => { if (item.isSelected) { this.deleteTemplate(item.id); } });
  }

}
