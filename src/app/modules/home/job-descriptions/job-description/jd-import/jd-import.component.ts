import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-jd-import',
  templateUrl: './jd-import.component.html',
  styleUrls: ['./jd-import.component.scss']
})
export class JdImportComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal,
    private router: Router
    ) { }
  files: any[] = [];
  file:any;
  fileToSend;
  sheetObject={};
  fileName:string;
  @ViewChild('closebutton') closebutton;
  ngOnInit(): void {
  }

  arrayBuffer:any;
 
  onFileDropped(files) {
    for(let i=0; i<files.length;i++){
      const file= files[i];
      const reader= new FileReader();
      reader.onload= (e)=>{
        this.fileName= file.name;
        this.fileToSend=file;
        console.log("fileName "+this.fileName);
        this.arrayBuffer= reader.result;
        var data = new Uint8Array(this.arrayBuffer);
        var arr= new Array();
        for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
        var bstr = arr.join("");
        var workbook = XLSX.read(bstr, {type:"binary"});
        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];
        this.sheetObject=XLSX.utils.sheet_to_json(worksheet,{raw:false});
        
      }
      reader.readAsArrayBuffer(file);
    }
   

  }

  // readHeadersAndDisplay(){
  //   this.router.navigate(['candidates/candidate/map-fields'],
  //   { queryParams: { fieldsToMap: JSON.stringify(this.sheetObject) }});
  //   this.closebutton.nativeElement.click();
  // }

  readHeadersAndDisplay(){
    var extras:NavigationExtras= 
    {state:
      {
        fieldsToMap:JSON.stringify(this.sheetObject) ,
        fileName:this.fileName,
        file: this.fileToSend
      }}
    this.router.navigate(['/home/job-descriptions/job-description/map-fields'], extras);
    this.closebutton.nativeElement.click();
  }


}
