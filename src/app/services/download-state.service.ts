import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DownloadStateService {
  private downloadingSubject = new BehaviorSubject<boolean>(false);
  // mostly for the app component to subscribe to this observable
  isDownloading$ = this.downloadingSubject.asObservable();

  setDownloading(val: boolean) {
    // When called with a boolean value, it pushes the new value to all subscribers by calling next on the subject. subscriber like app.component.ts
    this.downloadingSubject.next(val);
  }
}