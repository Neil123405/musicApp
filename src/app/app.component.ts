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
  // think of it this way as the view changes, @viewchild tells angular to look for the first IonMenu element in the view DOM and assign it to the menu property.
  // The ! assures Typescript compiler that the menu property will be defined after the view is initialized, so it won't throw an error when accessing it
  // if no ! is used then an error will be thrown saying that the menu property is possible undefined
  // Without it, TypeScript will require you to handle the case where menu might be undefined. or just remove it and type this.menu in an if statement
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
