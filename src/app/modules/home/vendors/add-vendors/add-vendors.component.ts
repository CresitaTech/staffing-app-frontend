import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { vendor } from 'src/app/models/vendor';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { CustomValidatorService } from 'src/app/services/common/custom-validator.service';

@Component({
  selector: 'app-add-vendors',
  templateUrl: './add-vendors.component.html',
  styleUrls: ['./add-vendors.component.scss']
})
export class AddVendorsComponent implements OnInit {

  @Output() refreshListEvt = new EventEmitter<any>();
  
  @Output() closeAddEditPage = new EventEmitter<any>();

  @Input() indexAsInput: string;
  @Input() eventId: string;
  vendor = new vendor(null, null, null, null, null, null, null, null, null, null, null, null);
  constants = Constants;
  subscription2$: Subscription;
  subscription1$: Subscription;
  @ViewChild("inp") inp: HTMLInputElement;


  constructor(
    private service: APIProviderService<vendor>,
    public customValidator :CustomValidatorService

  ) {
  }

  ngOnInit(): void {

  }

  ngOnChanges(): void {
    if (this.indexAsInput != undefined)
      this.getCardById(this.indexAsInput);

  }


  getCardById(index: string) {
    this.service.getCollectionItemById(APIPath.VENDORS, index).subscribe((res) => {
      this.vendor = res;
    }, error => {
      console.log(error);

    })
  }


  onEdit() {
    this.subscription2$ = this.service.putIdAPI
      (APIPath.VENDORS, this.indexAsInput, this.vendor).subscribe((res) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);

      })
  }

  onSubmit() {
    console.log(this.vendor)
    this.subscription1$ = this.service.postAPI(APIPath.VENDORS, this.vendor)
      .subscribe((res: any) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);

      });

  }

  refreshOnModifyOrAdd() {
    this.vendor = new vendor(null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    this.refreshListEvt.emit(null);
  }

  phoneNumberRef(event, element: HTMLInputElement, form: NgForm){
    this.customValidator.phoneNumberFormat(event, element,form);
   }
 
   preventEnter(event, formController) {
     this.customValidator.preventEnter(event, formController);
   }
   
   closeVendor(){
    this.closeAddEditPage.emit(null);
    }
 

}
