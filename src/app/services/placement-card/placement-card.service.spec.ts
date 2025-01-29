import { TestBed } from '@angular/core/testing';

import { PlacementCardService } from './placement-card.service';

describe('PlacementCardService', () => {
  let service: PlacementCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlacementCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
