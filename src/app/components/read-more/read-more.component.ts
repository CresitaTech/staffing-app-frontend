import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';

// @Component({
//   selector: 'app-read-more',
//   template: `
//   <div [class.collapsed]="isCollapsed">
//       <ng-content></ng-content>
//   </div>
//   <button type="button" *ngIf="isCollapsed" (click)="isCollapsed = !isCollapsed" class=" btn btn-sm btn-primary mt-1 mb-1">Read More</button>
//   <button type="button" *ngIf="!isCollapsed" (click)="isCollapsed = true" class="btn btn-sm btn-danger mt-1 mb-1">Read Less</button>


// `,
// styles: [`
//   div.collapsed {
//       height: 40px;
//       overflow: hidden;
//   }
// `]
// })

@Component({
  selector: 'app-read-more',
  template: `
        <div [innerHTML]="text" [class.collapsed]="isCollapsed" [style.height]="isCollapsed ? maxHeight+'px' : 'auto'">
        </div>
           
        <a [ngClass]="!isCollapsed ? 'btn btn-sm btn-danger mt-1 mb-1' : 'btn btn-sm btn-primary mt-1 mb-1'" *ngIf="isCollapsable  && !isDialog" (click)="onClicked()">Read {{isCollapsed? 'more':'less'}}</a>
        <a [ngClass]="!isCollapsed ? 'btn btn-sm btn-danger mt-1 mb-1' : 'btn btn-sm btn-primary mt-1 mb-1'" *ngIf="isDialog" (click)="onClicked()">Read {{isCollapsed? 'more':'less'}}</a>

    `,
    styles: [`
        div.collapsed {
            overflow: hidden;
        }
    `]
})

// <div style="color:#008a00;margin-top: -5px" >...read more</div>
// <div style="color:#008a00;margin-top: -5px" >...read less</div>

// export class ReadMoreComponent {
// isCollapsed = true;
// }


export class ReadMoreComponent implements AfterViewInit {

  //the text that need to be put in the container
  @Input() text: string;

  //maximum height of the container
  @Input() maxHeight: number = 100;

  @Input() isDialog: boolean = false;

  @Output() openDialog = new EventEmitter<null>();

  //set these to false to get the height of the expended container 
  public isCollapsed: boolean = false;
  public isCollapsable: boolean = false;

  constructor(private elementRef: ElementRef) {
  }

  onClicked(){
    if(!this.isDialog){
    this.isCollapsed = !this.isCollapsed;
    }else{
        this.openDialog.emit(null)
    }
  }

  ngAfterViewInit() {
      let currentHeight = this.elementRef.nativeElement.getElementsByTagName('div')[0].offsetHeight;
     //collapsable only if the contents make container exceed the max height
      if (currentHeight > this.maxHeight) {
          this.isCollapsed = true;
          this.isCollapsable = true;
      }
  }
}