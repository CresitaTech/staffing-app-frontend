import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router ,NavigationExtras } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Constants } from 'src/app/enums/constants.enum';
import * as XLSX from 'xlsx';
import { CandidateDeleteComponent } from '../candidate-delete/candidate-delete.component';
import { CandidateImportListComponent } from '../candidate-import-list/candidate-import-list.component';
import { CandidateReviewMessageComponent } from '../candidate-review-message/candidate-review-message.component';

@Component({
  selector: 'app-candidate-import',
  templateUrl: './candidate-import.component.html',
  styleUrls: ['./candidate-import.component.scss']
})
export class CandidateImportComponent implements OnInit {

  myFiles:string [] = [];
  doneFiles:string [] = [];
  displayLoder = false
  displayTable = false
  resumeData: any
  eventId: string
  files = []
  btnStatus = false
  btnAddStatus = true

  myForm = new FormGroup({
    file: new FormControl('', [Validators.required])
  });

  constructor(public activeModal: NgbActiveModal,
    private router: Router,
    private modalService: NgbModal,
    private http: HttpClient
    ) { }



  file:any;
  fileToSend;
  sheetObject={};
  fileName:string;
  @ViewChild('closebutton') closebutton;
  ngOnInit(): void {
  }

  get f(){
    return this.myForm.controls;
  }

  onFileChange(event) {
    this.file=(<HTMLInputElement>event.target).files[0];
    console.log(JSON.stringify(this.file))
    for (var i = 0; i < event.target.files.length; i++) { 
        this.myFiles.push(event.target.files[i]);
    }
    this.displayTable = true
  }

  updateButtonStatus($event) {
    console.log("btn status: " + $event.target.value)
    this.btnStatus = $event.target.value
    this.btnAddStatus = false
  }

  // Function is defined
  hideloader() {
      // Setting display of spinner
      // element to none
      this.displayLoder = false
  }

  readFile(event) {
    this.file=(<HTMLInputElement>event.target).files[0];
    console.log(this.file)
  }

  
  createCandidate(fileData){
    console.log("fileData: " + JSON.stringify(fileData.name))

    this.displayLoder = true
    const formData = new FormData();
    formData.append("files", fileData);
    this.http.post('https://mlapi.opallius.com/upload-files', formData)
      .subscribe(response => {
        if (response) {
            this.hideloader();
        }
        console.log(response)

        let result = JSON.parse(JSON.stringify(response))

        const modalRef = this.modalService.open(CandidateReviewMessageComponent, {
          backdrop: 'static',
          centered: true,
          keyboard: false,
          size: 'lg'
        });
        modalRef.componentInstance.resumes = result.resumes[0];
        modalRef.componentInstance.eventId = Constants.ADD;
        modalRef.componentInstance.resume_file = fileData.name;
        modalRef.componentInstance.resume = fileData;


        modalRef.result.then(res => {
          console.log(res)
          console.log("=======1")
          this.doneFiles.push(fileData);
          this.btnStatus = true
          this.btnAddStatus = false
          this.displayLoder = false
        }, error => {
          this.doneFiles.push(fileData);
          console.log(error);
          console.log("=======2")
          this.btnStatus = true
          this.btnAddStatus = false
          this.displayLoder = false
        });

      })

  }

  isDone(file){
    return this.doneFiles.includes(file);
  }


}
