import { TestBed } from '@angular/core/testing';

import { AssignmentListService } from './assignment-list.service';

describe('AssignmentListService', () => {
  let service: AssignmentListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssignmentListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
