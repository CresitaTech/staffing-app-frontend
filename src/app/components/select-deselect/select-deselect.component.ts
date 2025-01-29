import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Permission } from 'src/app/models/permission';
import { PermissionPipePipe as Pipe } from './../../pipes/permission-pipe/permission-pipe.pipe'
declare const $: any;

@Component({
  selector: 'app-select-deselect',
  templateUrl: './select-deselect.component.html',
  styles: [
    `
      .btn-secondary-highlighted {
        background-color: var(--corporate-green-light);
        border-color: var(--corporate-green-light);
      }
    `
  ],
  providers: [Pipe]
})
export class SelectDeselectComponent implements OnInit, OnChanges {

  // @Input() fromList: Array<any>;
  @Input() available_all: Array<any>;
  @Input() available_title: string;
  @Input() available_hint: string;

  @Input() choosen_all: Array<any>;
  @Input() choosen_title: string;
  @Input() choosen_hint: string;

  @Input() avoid_pipe?: boolean;

  @Output() onChangeEvt = new EventEmitter();

  collection_selected: Array<any> = [];
  permitted_selected: Array<any> = [];
  search: string = '';

  constructor() { }

  ngOnInit(): void {
    $('[data-tooltip="tooltip"]').tooltip({ trigger: 'hover' })
    this.removeSelectedFromAll();
  }


  ngOnChanges(): void {
    this.removeSelectedFromAll();
  }


  /**
   * all permissions should not show selected permissions.
   */
  removeSelectedFromAll() {
    if (this.choosen_all.length == 0) {
      console.log(1);
      return;
    }
    console.log(2);
    this.available_all = this.available_all
      .filter((c: Permission) => this.choosen_all.findIndex(p => p.id === c.id) === -1);
  }



  addPermission() {
    this.choosen_all.push(...this.collection_selected);
    console.log(this.choosen_all);
    this.available_all = this.available_all.filter(c => {
      if (!this.collection_selected.find(s => s.id === c.id))
        return c;
    })
    this.passChanges();
  }



  removePermission() {
    this.available_all.push(...this.permitted_selected);
    console.log(this.choosen_all);
    this.choosen_all = this.choosen_all.filter(c => {
      if (!this.permitted_selected.find(s => s.id === c.id))
        return c;
    })
    this.passChanges();
  }

  removeAll() {
    this.available_all.push(...this.choosen_all);
    this.choosen_all = [];
    this.passChanges();
  }

  chooseAll() {
    this.choosen_all.push(...this.available_all);
    this.available_all = [];
    this.passChanges();
  }

  passChanges(): void {
    this.onChangeEvt.emit(this.choosen_all);
  }

}
