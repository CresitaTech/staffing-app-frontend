import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Paging } from 'src/app/classes/paging';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { VendorTemplate } from 'src/app/models/vendor-template';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { SelectAllService } from 'src/app/services/common/select-all.service';
import { EditorChangeContent, EditorChangeSelection } from 'ngx-quill';
@Component({
  selector: 'app-add-vendor-temp',
  templateUrl: './add-vendor-temp.component.html',
  styleUrls: ['./add-vendor-temp.component.scss']
})
export class AddVendorTempComponent extends Paging<VendorTemplate> implements OnInit {

  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;


  emailTemplate = {} as VendorTemplate;
  constants = Constants;
  subscription1$: Subscription;
  subscription2$: Subscription;
  api_path = APIPath.VENDOR_TEMPLATE;
  editorText: string;

  constructor(
    private service: APIProviderService<VendorTemplate>,
    _selectAll: SelectAllService,
    public activeModal: NgbActiveModal,
  ) { super(service, _selectAll) }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    if (this.indexAsInput != undefined)
      this.getTemplateById(this.indexAsInput);
  }

  changedEditor(event: EditorChangeContent | EditorChangeSelection) {
    console.log('editor got changed', event);
    this.editorText = event['editor']['root']['innerHTML'];
  }

  getTemplateById(index: string) {
    this.service.getCollectionItemById(APIPath.VENDOR_TEMPLATE, index).subscribe((res) => {
      this.emailTemplate = res;
    }, error => {
      console.log(error);
    })
  }

  onEdit() {
    this.subscription2$ = this.service.putCollectionItemById
      (APIPath.VENDOR_TEMPLATE, this.indexAsInput, this.emailTemplate).subscribe((res) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();

        this.activeModal.dismiss('Successfully modified template');

      }, error => {
        console.log(error);
      })
  }


  onSubmit() {
    console.log("**************************")
    console.log(this.emailTemplate);
    this.subscription1$ = this.service.createCollectionItem(APIPath.VENDOR_TEMPLATE, this.emailTemplate)
      .subscribe((res: any) => {
        console.log(res);
        this.refreshOnModifyOrAdd();
        this.activeModal.dismiss(this.fetchCollectionList());
      }, error => {
        console.log(error);
      });
  }

  refreshOnModifyOrAdd() {
    this.emailTemplate = {} as VendorTemplate;
    this.refreshListEvt.emit(null);
  }

}
