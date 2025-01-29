import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/enums/constants.enum';
import { Client } from 'src/app/models/client';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { APIPath } from 'src/app/enums/api-path.enum';
import { CustomValidatorService } from 'src/app/services/common/custom-validator.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.scss']
})


export class AddClientComponent implements OnInit {


  @Output() refreshListEvt = new EventEmitter<any>();
  @Output() closeAddEditPage = new EventEmitter<any>();

  client = {} as Client;

  public countries: any;

  constants = Constants;
  subscription1$: Subscription;
  @Input() indexAsInput: string;
  @Input() eventId: string;
  subscription2$: Subscription;
  @ViewChild('closebutton') closebutton;

  @ViewChild("inp") inp: HTMLInputElement;
  @ViewChild("inp2") inp2: HTMLInputElement;

  constructor(private service: APIProviderService<Client>,
    public activeModal: NgbActiveModal,
    public customValidator: CustomValidatorService
  ) { this.client.country = '' }

  ngOnInit() {
    this.initialise();
    this.getCountriesList();
  }
  ngOnChanges(): void {
    this.initialise();
    this.onCountrySelected(event);
  }


  onCountrySelected(event) {
    //console.log(event)
  }

  initialise() {
    if (this.indexAsInput != undefined) {
      //console.log("input");
      this.getClientById(this.indexAsInput);
    }
  }

  getClientById(index: string) {
    this.service.getCollectionItemById(APIPath.CLIENT, index).subscribe((res) => {
      this.client = res;
    }, error => {
      console.log(error);

    })
  }

  getCountriesList(): void {
    this.service.getListAPI(APIPath.COUNTRIES).subscribe(res => {
      this.countries = res;
      var userCountry = sessionStorage.getItem(Constants.USER_COUNTRY);
      if(this.eventId===this.constants.ADD || this.eventId===this.constants.POP_UP){
      this.client.country = userCountry;
      }
      //console.log(this.countries)
    })
  }

  onEdit() {
    //console.log(this.client)
    this.subscription2$ = this.service.putCollectionItemById
      (APIPath.CLIENT, this.indexAsInput, this.client).subscribe((res) => {
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);
      })
  }


  onSubmit() {
    // console.log(this.client)
    this.subscription1$ = this.service.createCollectionItem(APIPath.CLIENT, this.client)
      .subscribe((res: any) => {
        //console.log(this.client)
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);
      });
  }

  ngOnDestroy() {
    // this.subscription1$.unsubscribe();
    // this.subscription2$.unsubscribe();
  }


  refreshOnModifyOrAdd() {
    this.client = {} as Client;
    this.refreshListEvt.emit(null);
    if (this.eventId === Constants.POP_UP) {
      this.closebutton.nativeElement.click();
    }
  }

  phoneNumberRef(event, element: HTMLInputElement, form: NgForm) {
    this.customValidator.phoneNumberFormat(event, element, form);
  }

  preventEnter(event, formController) {
    this.customValidator.preventEnter(event, formController);
  }

  closeClient() {
    this.closeAddEditPage.emit(null);
  }

}
