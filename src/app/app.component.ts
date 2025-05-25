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

  @ViewChild(IonMenu) menu!: IonMenu;

  isDownloading = false;

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
