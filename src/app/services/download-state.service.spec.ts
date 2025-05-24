import { TestBed } from '@angular/core/testing';

import { DownloadStateService } from './download-state.service';

describe('DownloadStateService', () => {
  let service: DownloadStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DownloadStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
