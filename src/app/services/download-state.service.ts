import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DownloadStateService {
  // This line creates a private property called `downloadingSubject` and initializes it as a new `BehaviorSubject` from the RxJS library, with an initial value of `false`. A `BehaviorSubject` is a special type of observable that always holds the latest value and emits it to any new subscribers immediately upon subscription. By using `<boolean>`, it specifies that this subject will only emit boolean values. The initial value of `false` indicates that, by default, no download is in progress. Making this property `private` ensures that it can only be accessed or modified within the service, enforcing encapsulation and allowing controlled updates to the download state through dedicated methods. This pattern is commonly used in Angular and reactive JavaScript applications to manage and broadcast state changes across different parts of the app.
  private downloadingSubject = new BehaviorSubject<boolean>(false);
  // mostly for the app component to subscribe to this observable
  isDownloading$ = this.downloadingSubject.asObservable();

  setDownloading(val: boolean) {
    // When called with a boolean value, it pushes the new value to all subscribers by calling next on the subject. subscriber like app.component.ts
    this.downloadingSubject.next(val);
  }
}