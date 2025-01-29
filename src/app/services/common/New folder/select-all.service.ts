import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { JobDescription } from 'src/app/models/job-description';

@Injectable({
  providedIn: 'root'
})


export class SelectAllService {
  job_description  = {} as JobDescription;

  private dataSubject = new Subject<string>();
//  mapJob1: any;
//  mapClient1: any;
mapInternal : Map<number, string>;
  constructor(
  ) { }

  count: number = 0;
  object: selectObject = {} as selectObject;

//// sam
  selectedItemSubject = new BehaviorSubject<any>(null);
  selectedItem$ = this.selectedItemSubject.asObservable();

  setSelectedClientID(item: any) {
    // this.selectedItemSubject.next(item);
    const serializedHashmap = sessionStorage.getItem('myHashmap');
const hashmap = JSON.parse(serializedHashmap);
console.log("hello")
console.log(hashmap)
console.log(item)

// Iterating over the Map using entries()
console.log("This is for entries");
console.log(this.mapInternal.entries);
  for (let [key, value] of this.mapInternal.entries()) {

    console.log("mapKey:", key);
    console.log("mapValue:", value);
    if(key==item){
      console.log("USD dollars11111")
      if(value=="India"){
      this.job_description.currency="INR";
      console.log(this.job_description.currency)
      this.sendDataToComponent(this.job_description.currency)
    }else{
      this.job_description.currency="USD";
      this.sendDataToComponent(this.job_description.currency)
    }
    }
  }


// for (const key in hashmap) {
//   console.log("mapKey")
//   console.log(key)
//   console.log("mapValue")
//   console.log(hashmap[key])
//   if (hashmap.hasOwnProperty(key)) {
//     const value = hashmap[key];
//     console.log(`Key: ${key}, Value: ${value}`);

//   }
// }

// Using Object.keys() and Object.values()
// const keys = Object.keys(hashmap);
// const values = Object.values(hashmap);

// for (let i = 0; i < keys.length; i++) {
//   console.log(`Key: ${keys[i]}, Value: ${values[i]}`);
// }
  }
  sendDataToComponent(data: string) {
    this.dataSubject.next(data);
  }

  getDataObservable() {
    return this.dataSubject.asObservable();
  }

  ///////sam

setMap(map:Map<number, string>){
  console.log("Map Start");
  console.log(map);
  console.log("Map End");
  
  this.mapInternal = map;

  // Iterating over the Map using entries()
  // for (let [key, value] of this.mapInternal.entries()) {
  //   console.log("mapKey:", key);
  //   console.log("mapValue:", value);
  // }
}

  

// setMapDetails(mapJob:any,mapClient:any){
//   this.mapJob1 = mapJob;
//   this.mapClient1 = mapClient;
// }

// getMapDetails


////sam


  //To be called as soon as Select All button clicked. 
  //Function:Set all clients as Selected and increase the count to display. 
  countCheckOrUncheck(model: any, masterSelected: boolean, collectionMapForSelectFlag: Map<string, boolean>, collectionMapForEmail: Map<string, string>, collectionMapForId: Map<string, string>, collectionMapForPriority, collectionMapForName: Map<string, string>): number {
    this.count = 0;
    model.forEach((item: any) => {
      item.isSelected = masterSelected;
      if (item.isSelected) {
        // this.count++;
        //  console.log(item)
        collectionMapForSelectFlag.set(item.id, item.isSelected);
        if (item.priority != undefined) { collectionMapForPriority.set(item.id, item.priority); }
        if (item.primary_email !== undefined) { collectionMapForEmail.set(item.id, item.primary_email); }
        if (item.first_name !== undefined) { collectionMapForName.set(item.id, item.first_name + " " + item.last_name); }
        if (item.id !== undefined) { collectionMapForId.set(item.id, item.id) }
      }
      else
        collectionMapForSelectFlag.set(item.id, false);
    }
    )

    collectionMapForSelectFlag.forEach((value, key) => {
      if (value === true) {
        this.count++;
      }
    })
    return this.count;

  }

  //To be called for individual  selects [checkbox].
  allSelected(model: any, masterSelected: boolean, collectionMapForSelectFlag: Map<string, boolean>, collectionMapForEmail: Map<string, string>, collectionMapForId: Map<string, string>, collectionMapForPriority, collectionMapForName: Map<string, string>): selectObject {
    this.count = 0;
    model.forEach((item: any) => {
      if (item.isSelected) {
        collectionMapForSelectFlag.set(item.id, item.isSelected);
        if (item.priority != undefined) { collectionMapForPriority.set(item.id, item.priority); }
        if (item.primary_email !== undefined) { collectionMapForEmail.set(item.id, item.primary_email); }
        if (item.first_name !== undefined) { collectionMapForName.set(item.id, item.first_name + " " + item.last_name); }
        if (item.id !== undefined) { collectionMapForId.set(item.id, item.id) }
        //this.count++;
      }
      else
        collectionMapForSelectFlag.set(item.id, false);
    })

    collectionMapForSelectFlag.forEach((value, key) => {
      if (value === true) {
        this.count++;
      }
    })
    masterSelected = model.every((item: any) => {
      return item.isSelected == true;
    })
    this.object.masterSelected = masterSelected;
    this.object.count = this.count;
    return this.object;
  }
}

export interface selectObject {
  masterSelected: boolean;
  count: number
}
