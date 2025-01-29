import { TestBed } from '@angular/core/testing';

import { Http_Interceptor } from './http-interceptor.interceptor';

describe('Http_Interceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      Http_Interceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: Http_Interceptor = TestBed.inject(Http_Interceptor);
    expect(interceptor).toBeTruthy();
  });
});
