import { TestBed } from '@angular/core/testing';

import { SubmissionListService } from './submission-list.service';

describe('SubmissionListService', () => {
  let service: SubmissionListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubmissionListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
