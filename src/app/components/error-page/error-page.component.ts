import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-error-page',
  templateUrl: 'error-page.component.html',
  styles:[`
    .heading { 
      font-size: 150px; 
      font-weight: 400; 
      line-height: 170px;
      text-shadow: 2px 2px 8px #FF0000;
    }
    .heading2 { font-size: 14px; }
  `],
  styleUrls: ['./../../modules/login/login.component.scss']
})
export class ErrorPageComponent implements OnInit {

  constructor(
    private location: Location
  ) { }

  ngOnInit(): void {
  }

  goBack(): void {
    this.location.back();
  }

}
