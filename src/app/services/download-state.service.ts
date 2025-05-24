import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DownloadStateService {
  private downloadingSubject = new BehaviorSubject<boolean>(false);
  isDownloading$ = this.downloadingSubject.asObservable();

  setDownloading(val: boolean) {
    this.downloadingSubject.next(val);
  }
}