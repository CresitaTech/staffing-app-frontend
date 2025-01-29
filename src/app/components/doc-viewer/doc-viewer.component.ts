import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Constants } from 'src/app/enums/constants.enum';
declare const $:any;

@Component({
  selector: 'app-doc-viewer',
  templateUrl: './doc-viewer.component.html',
  styleUrls: ['./doc-viewer.component.scss']
})
export class DocViewerComponent implements OnInit {
@Input() url;
@Output() actionToBePerformed = new EventEmitter<any>();
constants=Constants;
//@Input() index;
  constructor(
    public activeModal: NgbActiveModal
  ) { }

  @ViewChild('iframe') iframe: ElementRef;

  ngOnInit(): void {
  }

  // ngAfterViewInit() {
  //   const nativeEl =  this.iframe.nativeElement;
  //   if ( (nativeEl.contentDocument || nativeEl.contentWindow.document).readyState === 'complete' )        {
  //       nativeEl.onload = this.onIframeLoad.bind(this);
  //   } else {
  //     if (nativeEl.addEventListener) {
  //       nativeEl.addEventListener('load', this.onIframeLoad.bind(this), true);
  //     } else if (nativeEl.attachEvent) {
  //       nativeEl.attachEvent('onload', this.onIframeLoad.bind(this));
  //     }
  //   }
  // }

  // onIframeLoad() {
  //   const base64String = this.iframe.nativeElement.contentWindow.document.body.innerHTML;
  //   console.log(this.iframe.nativeElement.contentWindow.document.body.children[1].currentSrc);
  // }

  selectAction(action:string){
   //console.log(action)
    this.actionToBePerformed.emit(action);
  }

  searchKeyWord(){
    var value =(document.getElementById('keyword') as HTMLSelectElement).value;
    console.log(value);
    
  //  var iframe = document.getElementsByTagName("iframe")[0].contentWindow;
    var iframe = document.getElementsByTagName("iframe")[0];
    //iframe.postMessage('data','*');
     console.log(iframe);
    window.addEventListener('message', event => {
      // IMPORTANT: check the origin of the data! 
    //  if (event.origin.startsWith('http://your-first-site.com')) { 
          // The data was sent from your site.
          // Data sent with postMessage is stored in event.data:
          console.log(event.data); 
   //   } else {
          // The data was NOT sent from your site! 
          // Be careful! Do not use it. This else branch is
          // here just for clarity, you usually shouldn't need it.
     //     return; 
     // } 
  }); 
  }

}
