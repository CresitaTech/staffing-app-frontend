import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router ,NavigationExtras } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Resume } from 'src/app/models/resume';
import * as XLSX from 'xlsx';
import { CandidateDeleteComponent } from '../candidate-delete/candidate-delete.component';
import { CandidateReviewMessageComponent } from '../candidate-review-message/candidate-review-message.component';

@Component({
  selector: 'app-candidate-import-list',
  templateUrl: './candidate-import-list.component.html',
  styleUrls: ['./candidate-import-list.component.scss']
})
export class CandidateImportListComponent implements OnInit {

  myFiles:string [] = [];
  @Input() resumes: Resume;
  myForm = new FormGroup({
    file: new FormControl('', [Validators.required])
  });

  constructor(public activeModal: NgbActiveModal,
    private router: Router,
    private modalService: NgbModal,
    private http: HttpClient
    ) { }
  files = [];
  file:any;
  fileToSend;
  sheetObject={};
  fileName:string;
  @ViewChild('closebutton') closebutton;
 
  
  ngOnInit(): void {
    this.initialise()
  }


  ngOnChanges() {
    this.initialise();
  }

  
  initialise() {
    //console.log("init: " + JSON.stringify(this.resumes))
    if (this.resumes != undefined){
      this.files.push(this.resumes)
      console.log("Resume data received : " + JSON.stringify(this.files))
      /**this.candidate.first_name = name[0];
      this.candidate.last_name = name[1];
      this.candidate.primary_email = this.resumes.email;
      this.candidate.primary_phone_number = this.resumes.phone;
      this.candidate.total_experience = this.resumes.total_exp;
      
      this.candidate.qualification = this.resumes.degree;
      this.candidate.skills_1 = this.resumes.skills;
      this.candidate.additional_qualification = this.resumes.university; */
    }
      
  }


  get f(){
    return this.myForm.controls;
  }

  onFileChange(event) {
   
    for (var i = 0; i < event.target.files.length; i++) { 
        this.myFiles.push(event.target.files[i]);
    }
  }

  submit(){
    const formData = new FormData();
    for (var i = 0; i < this.myFiles.length; i++) { 
      formData.append("files", this.myFiles[i]);
    }
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    let options = { headers: headers };
  
    this.http.post('https://mlapi.opallius.com/upload-files', formData)
      .subscribe(response => {

        console.log(response)
        let result = JSON.parse(JSON.stringify(response))
        console.log(response);
        const modalRef = this.modalService.open(CandidateReviewMessageComponent, {
          backdrop: 'static',
          centered: true,
          keyboard: false,
          size: 'lg'
        });
        modalRef.componentInstance.resumes = result.resumes[0];
        modalRef.result.then(res => {
          console.log(res)
        }, error => {
          console.log(error);
        });


      })
  }


  readFile(event) {
    this.file=(<HTMLInputElement>event.target).files[0];
    console.log(this.file)
  }


  createCandidate(fileData){
    console.log("fileData: " + JSON.stringify(fileData))

    const modalRef = this.modalService.open(CandidateReviewMessageComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      size: 'lg'
    });
    modalRef.componentInstance.resumes = fileData;
    modalRef.result.then(res => {
      console.log(res)
    }, error => {
      console.log(error);
    });

  }

}
