import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-job-descriptions',
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [
  ]
})
export class JobDescriptionsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
