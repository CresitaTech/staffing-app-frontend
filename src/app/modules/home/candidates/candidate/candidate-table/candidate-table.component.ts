import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { APIPath } from 'src/app/enums/api-path.enum';
import { Candidate } from 'src/app/models/candidate';
import { APIProviderService } from 'src/app/services/api-provider.service';


@Component({
  selector: 'app-candidate-table',
  templateUrl: './candidate-table.component.html',
  styleUrls: ['./candidate-table.component.scss']
})


export class CandidateTableComponent {
 api_path=APIPath.CANDIDATE;
 candidate= {} as Candidate;
 keysInJson= new Set();
 keysInCollection= new Set();
objectToPost:requestObj = {} as requestObj;

 candidateSingleObject: any;
 fileName;
 file;
 data;
 
 @ViewChildren("selectField") fieldSelect: QueryList<ElementRef<HTMLSelectElement>>;
 selectedfields = new Set<string>();
 primaryKeylist = Array<string>();

 temp: string;
 map1 = new Map<number, string>();
 map2 = new Map<any, string>();
 formData: FormData;
 
 constructor(
    private route:ActivatedRoute,
    private _api: APIProviderService<Candidate>,
    private router:Router
  ) { 

    this.primaryKeylist.push("designation");
    this.primaryKeylist.push("id");
    this.primaryKeylist.push("job_description");
    this.primaryKeylist.push("stage");
    this.primaryKeylist.push("created_at");
    this.primaryKeylist.push("updated_at");
    this.primaryKeylist.push("created_by");
    this.primaryKeylist.push("updated_by");
    this.primaryKeylist.push("created_by_id");
    this.primaryKeylist.push("updated_by_id");
    this.route.queryParams.subscribe(
      (params) => {
         //let data = JSON.parse(params['fieldsToMap']);
         if(this.router.getCurrentNavigation().extras.state){
         this.data = JSON.parse(this.router.getCurrentNavigation().extras.state.fieldsToMap);
         this.fileName= this.router.getCurrentNavigation().extras.state.fileName;
         this.file= this.router.getCurrentNavigation().extras.state.file;
         console.log("this file");
         console.log(this.file);
        //Get File Headers
         this.getFileHeaders();
         this.getList();
        }
    
  })
 }


  getFileHeaders(){
    this.data.forEach(element => {
      Object.keys(element).forEach(key=>{
        this.keysInJson.add(key);

        this.primaryKeylist.forEach(element => {
          if(this.keysInJson.has(element))
          this.keysInJson.delete(element);
        });
      })
     })
    // console.log(this.keysInJson)
  }


  ngOnInit(): void {
}


getList(): void {

  this._api.getListAPI(this.api_path + '?ordering=-created_at&offset=0&limit=10').subscribe((res)=>{
    this.candidate=res['results'];
    //console.log("***************************getList")
    //console.log(this.candidate);
    this.candidateSingleObject=this.candidate[0];
    Object.keys(this.candidateSingleObject).forEach(key=>{
      this.keysInCollection.add(key);

      this.primaryKeylist.forEach(element => {
        if(this.keysInCollection.has(element))
        this.keysInCollection.delete(element);
      });
    //  console.log("***************Key In colledction")
     
    })
  })
 // console.log(this.keysInCollection)
  }


 onSubmit(){
  // console.log(this.candidate);
  var tem = 0;
  while (tem < this.list.length) {
    if (this.map1.has(tem)) {
      // console.log("list" + this.list[tem]);
      this.map2.set(this.list[tem], this.map1.get(tem));
      this.map1.delete(tem);
    }
    tem++;
  }
  this.convertToJson(this.map2);
 }



 convertToJson(map2) {
  let jsonObject = {};
  map2.forEach((value, key) => {
    jsonObject[key] = value;
  });
  jsonObject["job_description"]=this.candidate.job_description;
  jsonObject["stage"]=this.candidate.stage;
  jsonObject["designation"]=this.candidate.designation;

  this.objectToPost.data_fields=JSON.stringify(jsonObject);
  //console.log(JSON.stringify(jsonObject));

  this.appendToFormData();
  this._api.createCollectionItem(APIPath.IMPORT,this.formData)
      .subscribe((res: any) => {
        // console.log(res);
        this.router.navigate(['/home/candidates/candidate']);
      });
}



onReset(){
  this.router.navigate(['/home/candidates/candidate']);
}


appendToFormData() {
  this.formData = new FormData();
  const keys = Object.keys(this.objectToPost);
  keys.forEach(k => {
    if (this.objectToPost[k]) this.formData.append(k, this.objectToPost[k])
  })
  this.formData.append('file', this.file);
  this.formData.append('module','Candidates');
}


 list = [this.keysInCollection.size];
 
  selected(idx, databasekeys) {
    this.list[idx] = databasekeys;
    this.selectedfields.clear();
    var count = 0;
    this.selectedfields.clear();
    this.fieldSelect.forEach(ls => {
      const selectedVal = ls.nativeElement.value;
      if (selectedVal && selectedVal !== "undefined") {
           this.selectedfields.add(selectedVal)
           this.map1.set(count, selectedVal);
        }
        count++;
    });
  }


  isSelected(fields) {
    return this.selectedfields.has(fields);
  }
}

export interface requestObj{
  tag:string;
  file:string;
  data_fields:string;
}

