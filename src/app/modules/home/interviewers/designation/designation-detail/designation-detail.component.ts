import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Designation } from 'src/app/models/designation';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { DesignationService } from 'src/app/services/designation/designation.service';

@Component({
  selector: 'app-designation-detail',
  templateUrl: './designation-detail.component.html',
  styleUrls: ['./designation-detail.component.scss']
})
export class DesignationDetailComponent implements OnInit, OnDestroy {

  private getDesignationSub: Subscription;
  subscription2$: Subscription;

  designation = {} as Designation;
  @Output() refreshListEvt = new EventEmitter<boolean>();
  @Input() eventId: string;
  @Input() indexAsInput: string;
  @Input() isPopup: boolean;
  formData: FormData;

  constructor(
    // private designationService: DesignationService,
    private _api: APIProviderService<Designation>,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    if (this.indexAsInput != undefined)
      this.getDesignationById(this.indexAsInput);
  }

  ngOnDestroy(): void {
    if (this.getDesignationSub) this.getDesignationSub.unsubscribe();
  }

  private getDesignationById(id: string) {
    this.getDesignationSub = this._api.
      getCollectionItemById(APIPath.DESIGNATION, id)
      .subscribe((res: Designation) => {
        this.designation = res;
      }, err => {
        // TODO: handle error here
        console.log(err);
      })
  }

  onSave(isNew: boolean) {
    const request = isNew
      ? this._api.createCollectionItem(APIPath.DESIGNATION,this.designation)
      : this._api.putCollectionItemById(APIPath.DESIGNATION, this.designation.id, this.designation);
    request.subscribe((res: Designation) => {
      // TODO: do something here
      if (this.isPopup)
        this.activeModal.close(res);
      else
        this.closeFunction(true);
    }, err => {
      // TODO: handle error here
      console.log(err);
    });
  }

  closeFunction(refreshPage: boolean): void {
    this.refreshListEvt.emit(refreshPage);
  }

}
