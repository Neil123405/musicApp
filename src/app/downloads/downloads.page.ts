import { Component, OnInit } from '@angular/core';
import { MusicService } from '../services/music.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-downloads',
  templateUrl: './downloads.page.html',
  styleUrls: ['./downloads.page.scss'],
  standalone: false
})
export class DownloadsPage implements OnInit {
  downloadedTracks: any[] = [];

  constructor(public musicService: MusicService, private toastController: ToastController) {}

  async ngOnInit() {
    this.downloadedTracks = await this.musicService.getDownloadedTracks();
  }

  play(track: any) {
    this.musicService.playDownloadedTrack(track);
  }

    async delete(track: any) {
      console.log('Attempting to delete:', track);
    const success = await this.musicService.deleteDownloadedTrack(track);
    if (success) {
      console.log('File deleted:', track.localPath);
      this.downloadedTracks = await this.musicService.getDownloadedTracks();
      this.showToast('Track deleted successfully.');
    } else {
      console.error('Failed to delete file:', track.localPath);
      alert('Failed to delete track.');
      this.showToast('Failed to delete track.');
    }
  }

   async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      color: 'primary'
    });
    toast.present();
  }
}