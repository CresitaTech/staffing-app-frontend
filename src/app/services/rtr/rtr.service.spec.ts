import { TestBed } from '@angular/core/testing';

import { RtrService } from './rtr.service';

describe('RtrService', () => {
  let service: RtrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RtrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
