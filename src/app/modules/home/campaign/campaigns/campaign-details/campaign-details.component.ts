import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CustomFilterModel } from 'src/app/classes/custom-filter';
import { CustomFilterInterface } from 'src/app/models/filters';
import { EmailList } from 'src/app/models/email-list';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { FilterComponent } from 'src/app/components/filter/filter.component';
import { Constants } from 'src/app/enums/constants.enum';
import { APIPath } from 'src/app/enums/api-path.enum';
import { DeleteComponent } from 'src/app/components/delete/delete.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CampaignDisplayComponent } from './email-display/campaign-display.component';



const _NgbModalOptions: NgbModalOptions = { backdrop: 'static', centered: true, keyboard: false };

@Component({
  selector: 'app-campaign-details',
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.scss']
})
export class CampaignDetailsComponent extends CustomFilterModel<EmailList> implements OnInit, OnDestroy, CustomFilterInterface {

  api_path = APIPath.CAMPAIGN_DETAILS;

  @ViewChild(FilterComponent) filter: FilterComponent;

  @HostListener('window:afterunload') goToPage() {
    this.router.navigate(['/home/campaign/campaign']);
  }

  constants = Constants;
  eventId: string;
  indexAsInput;
  tagName;
  emailId: string;
  listData: Array<string>;
  collection: any;
  state$: any;
  listId: any;
  data: any;
  listName: any;
  templateName: any;
  emailName: any;

  searchQuery: any = "";
  myActionFlag: string;

  constructor(
    private service: APIProviderService<EmailList>,
    selectAllService: SelectAllService,
    private router: Router,
    private modalService: NgbModal,
    public activatedRoute: ActivatedRoute
  ) {
    super(service, selectAllService);
    this.filterOn.push({ model: 'list_name' },
      { model: 'template_name' },
      { model: 'list_description' }
    );
    this.listId = this.router.getCurrentNavigation().extras.state.listId;
    //console.log(this.listId)
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }
  openFilter(): void {
    throw new Error('Method not implemented.');
  }
  removeFilter(filter: string): void {
    throw new Error('Method not implemented.');
  }

  ngOnDestroy(): void { }

  ngOnInit() {

    this.routerURL = this.router.url.split("/")[3];
    console.log(this.routerURL)
    this.fetchCollectionList();
    this.collection;
    this.collectionSize;
    console.log(this.collection)
    console.log(this.collectionSize)
  }

  ngOnChanges() {
    this.routerURL = this.router.url.split("/")[3];
    if (this.routerURL === "campaign-details") {
      this.myActionFlag = 'campaign-details';
      console.log(this.routerURL)
      var url = this.api_path + "?campaign_id=" + this.listId;
      console.log(url)
      this.fetchCollectionListWithExactAPI(url + `&limit=${this.limit}&offset=${this.offSet()}&search=&ordering=-created_at`);
    }
  }

  // To edit a email list
  openTemplate(index: string) {
    this.eventId = Constants.POP_UP;
    const modalRef = this.modalService.open(CampaignDisplayComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'xl'
    });

    modalRef.componentInstance.email_to = this.collection[index].email_to;
    modalRef.componentInstance.email_subject = this.collection[index].email_subject;
    modalRef.componentInstance.email_body = this.collection[index].email_body;
    modalRef.result.then(res => {
    });
  }

  // Refresh operations
  // 1. Page
  refreshPage(): void {
    this.fetchCollectionList();
  }


  // Delete Email List Pop up
  openDeleteModel(listName: string, listID: string): void {
    const modalRef = this.modalService.open(DeleteComponent, _NgbModalOptions);
    modalRef.componentInstance.name = listName;
    modalRef.componentInstance.id = listID;
    modalRef.componentInstance.title = Constants.VENDOR_LIST;
    //this.collection.forEach(item => {
    //  if (item.id === listID) { modalRef.componentInstance.name = item.list_name; }
    //})
    modalRef.result.then(res => {
      if (res.result) {
        // this.deleteEmailList(res.id);
      }
    });
  }

}


/*export interface ListDetails{
  list_name= string;
  template_name = string;

} */
