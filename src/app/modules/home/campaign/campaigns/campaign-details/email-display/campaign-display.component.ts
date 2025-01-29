import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EmailList } from 'src/app/models/email-list';
import { APIProviderService } from 'src/app/services/api-provider.service';
import { FormsModule }   from '@angular/forms';

@Component({
  selector: 'app-campaign-display',
  templateUrl: './campaign-display.component.html',
  styleUrls: ['./campaign-display.component.scss']
})
export class CampaignDisplayComponent implements OnInit {
  @ViewChild('closebutton') closebutton;

  @Input() email_to;
  @Input() email_subject;
  @Input() email_body;
  @Input() eventId;

  @Output() refreshListEvt = new EventEmitter<any>();

  constructor(private service: APIProviderService<EmailList>,
    public activeModal: NgbActiveModal) {
  }


  ngOnInit(): void {

  }


}
