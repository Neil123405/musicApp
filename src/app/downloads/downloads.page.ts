import { Component, OnInit } from '@angular/core';
import { MusicService } from '../services/music.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-downloads',
  templateUrl: './downloads.page.html',
  styleUrls: ['./downloads.page.scss'],
  standalone: false
})
export class DownloadsPage implements OnInit {
  downloadedTracks: any[] = [];

  constructor(public musicService: MusicService, private toastController: ToastController, 
    private router: Router,) {}

  async ngOnInit() {
    this.downloadedTracks = await this.musicService.getDownloadedTracks();
  }

  async play(track: any) {
  this.downloadedTracks = await this.musicService.getDownloadedTracks();
  this.musicService.playlist = this.downloadedTracks.slice();
  this.musicService.currentPlaylistName = 'downloads';
  await this.musicService.playDownloadedTrack(track);
  this.router.navigate(['/player']);
}

    async delete(track: any) {
      console.log('Attempting to delete:', track);
    const success = await this.musicService.deleteDownloadedTrack(track);
    if (success) {
      console.log('File deleted:', track.localPath);
      this.downloadedTracks = await this.musicService.getDownloadedTracks();
      this.showToast('Track deleted successfully.');
      if (
      this.musicService.currentTrack &&
      this.musicService.currentTrack.id === track.id &&
      this.musicService.currentPlaylistName === 'downloads'
    ) {
      this.musicService.pause();
      this.musicService.currentTrack = null;
      this.musicService.currentPlaylistName = null;
      this.musicService.playlist = [];
    }
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