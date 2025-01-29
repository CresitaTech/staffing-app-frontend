import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Constants } from 'src/app/enums/constants.enum';
import { CandidateRepository } from 'src/app/models/candidate-repository';
import { APIProviderService } from 'src/app/services/api-provider.service';

@Component({
  selector: 'app-add-repository',
  templateUrl: './add-repository.component.html',
  styleUrls: ['./add-repository.component.scss']
})
export class AddRepositoryComponent implements OnInit {
  @Output() refreshListEvt = new EventEmitter<any>();
  @Input() indexAsInput: string;
  @Input() eventId: string;
  candidate_repo = {} as CandidateRepository;
  constants = Constants;
  subscription2$: Subscription;
  subscription1$: Subscription;
  file: File;
  @Input() candidate_name;
  @Input() candidate_id: string;
  @Input() candidate_full_name;
  @Input() resume;
  @ViewChild('closebutton') closebutton;


  constructor(
    public service: APIProviderService<CandidateRepository>,
    public activeModal: NgbActiveModal,

  ) {
    
  }

  ngOnInit(): void {
    if(this.candidate_id!==undefined){
      this.eventId=this.constants.EDIT_POP_UP;
      
       this.getRepoByCandidateId(this.candidate_id);
    }

  }

  ngOnChanges(): void {
    if (this.indexAsInput != undefined){
      this.getRepoById(this.indexAsInput);
    }

   
  }

  getRepoByCandidateId(index:string){
   this.service.getCollectionItemByCandidateId(APIPath.REPO_BY_CANDIDATE_ID,index).subscribe(res=>{
    this.candidate_repo.repo_name=res[0].repo_name;
    this.indexAsInput=res[0].id;
    this.candidate_repo.candidate_name=res[0].candidate_name;
    this.candidate_repo.resume=res[0].resume;
    this.candidate_repo.passport=res[0].passport;
    this.candidate_repo.offer_letter=res[0].offer_letter;
    this.candidate_repo.driving_license=res[0].driving_license;
    this.candidate_repo.salary_slip=res[0].salary_slip;
    this.candidate_repo.rtr=res[0].rtr;
    this.candidate_repo.i94_document=res[0].i94_document;
    this.candidate_repo.visa_copy=res[0].visa_copy;
    this.candidate_repo.educational_document=res[0].educational_document;
    this.candidate_repo.description=res[0].description;

   }, error=>{
     console.log(error);
   })
  }

  detailsOfSelectedCandidate(evt){
    this.candidate_repo.candidate_name= evt.id;
    this.getRepoByCandidateId(this.candidate_repo.candidate_name);
  }

  getRepoById(index: string) {
    this.service.getCollectionItemById(APIPath.CANDIDATE_REPO, index).subscribe((res) => {
      this.candidate_repo = res;
      this.candidate_repo.repo_name=res.repo_name;
      this.candidate_repo.resume=res.resume;
      this.candidate_repo.passport=res.passport;
      this.candidate_repo.offer_letter=res.offer_letter;
      this.candidate_repo.driving_license=res.driving_license;
      this.candidate_repo.salary_slip=res.salary_slip;
      this.candidate_repo.rtr=res.rtr;
      this.candidate_repo.i94_document=res.i94_document;
      this.candidate_repo.visa_copy=res.visa_copy;
      this.candidate_repo.educational_document=res.educational_document;
      this.candidate_repo.description=res.description;

      //console.log(this.candidate_repo.rtr);
    }, error => {
      console.log(error);

    })
  }

 

  formData = new FormData();
  keys = Object.keys(this.candidate_repo);


  readFile(event , keyName:string) {
    this.file=(<HTMLInputElement>event.target).files[0];
    this.formData.append(keyName, this.file);
  }



  onEdit() {
    this.formData.append("repo_name",this.candidate_repo.repo_name);
    this.formData.append("candidate_name",this.candidate_repo.candidate_name);
    this.formData.append("description",this.candidate_repo.description);
    this.subscription2$ = this.service.patchCollectionItemById
      (APIPath.CANDIDATE_REPO, this.indexAsInput, this.formData).subscribe((res) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);

      })
  }

  onSubmit() {
    console.log(this.candidate_repo);
    if (this.candidate_repo.candidate_name===undefined) {
      this.candidate_repo.candidate_name=this.candidate_id;
    }
    this.formData.append("repo_name",this.candidate_repo.repo_name);
    this.formData.append("candidate_name",this.candidate_repo.candidate_name);
    this.formData.append("description",this.candidate_repo.description);

    this.subscription1$ = this.service.createCollectionItem(APIPath.CANDIDATE_REPO, this.formData)
      .subscribe((res: any) => {
        // console.log(res);
        this.refreshOnModifyOrAdd();
      }, error => {
        console.log(error);

      });

  }

  refreshOnModifyOrAdd() {
    this.candidate_repo = {} as CandidateRepository
    this.refreshListEvt.emit(null);
    if(this.eventId===this.constants.POP_UP||this.eventId===this.constants.EDIT_POP_UP){
      this.closebutton.nativeElement.click();
    }
  }


}

