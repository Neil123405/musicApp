import { Component } from '@angular/core';
import { IonMenu } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { DownloadStateService } from './services/download-state.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  // Property decorator that configures a view query. The change detector looks for the first element or the directive matching the selector in the view DOM. If the view DOM changes, and a new child matches the selector, the property is updated.
  // Angular has a change detector
  // IonMenu is a reference to the IonMenu component class.

  @ViewChild(IonMenu) menu!: IonMenu;

  isDownloading = false;

  // observable from the download state service
  // keeping the UI in sync with application state
  constructor(private downloadState: DownloadStateService) {
    this.downloadState.isDownloading$.subscribe(val => {
      this.isDownloading = val;
    });
  }

  async toggleMenu() {
    if (await this.menu.isOpen()) {
      this.menu.close();
    } else {
      this.menu.open();
    }
  }
}
