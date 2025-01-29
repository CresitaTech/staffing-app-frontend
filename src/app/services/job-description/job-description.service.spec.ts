import { TestBed } from '@angular/core/testing';

import { JobDescriptionService } from './job-description.service';

describe('JobDescriptionService', () => {
  let service: JobDescriptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobDescriptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
