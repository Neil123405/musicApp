import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MusicService } from 'src/app/services/music.service';
import { NavController, ToastController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DownloadStateService } from '../services/download-state.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  tracks: any[] = [];
  clientId = '0f6f38b8';
  currentIndex: number = -1;
  searchQuery = '';
  isDownloading = false;
  isLoading = false;
  errorMsg = '';
  likedTrackIds: Set<string> = new Set();
  downloadedTrackIds: Set<string> = new Set();

  constructor(
    public musicService: MusicService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private downloadState: DownloadStateService,
  ) { }

  async ngOnInit() {
    await this.refreshTrackStates();
    await this.searchTracks(''); // load diritso ang mga tracks 
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 1200, color: 'primary' });
    toast.present();
    // vibrate
    Haptics.impact({ style: ImpactStyle.Medium });
  }

  async searchTracks(query: string) {
    this.errorMsg = '';
    try {
      this.tracks = await this.musicService.getTracksFromApi(query, this.clientId);
    } catch (err) {
      this.errorMsg = 'Failed to load tracks. Please try again later.';
    }
    this.isLoading = false;
  }


  onSearch(event: any) {
    // value sa input
    const val = event.detail.value;
    this.searchQuery = val;
    this.searchTracks(val); // fetch new results as user types
  }

  doRefresh(event: any) {
    this.searchTracks(this.searchQuery);
    // delay completion sa refresh para dili mag yagaw or flicker
    setTimeout(() => {
      event.target.complete();
    }, 800);
  }

  playTrack(track: any) {
    // mura siya ug loop hagntod makita ang music gi pili nimo BECAUSE track is tracks array variable
    this.currentIndex = this.tracks.findIndex(t => t.id === track.id);
    // ensuring para ang playlist kay properly set siya before playback
    this.musicService.track = this.tracks;
    // By setting currentPlaylistName to null, it indicates that the user is not playing from a named playlist or saved playlist, but rather from the general track list.
    this.musicService.currentKeyName = null;
    // ee call ang service para mag play ug sound
    this.musicService.play(track);
    // navigate ra ni siya 
    this.navCtrl.navigateForward('/player');
    // toaste notif
    this.showToast(`Playing: ${track.name}`);
  }

  async addToPlaylist(track: any, event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevent triggering playTrack kay naa man siya gi place sa lugar nga asa ee play ang music
    }
    // calls the service function
    await this.musicService.addToPlaylist(track, 'MyPlaylist');
    await this.refreshTrackStates();
    this.showToast(`Added to Playlist: ${track.name}`);
  }

  async downloadTrack(track: any, event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevent triggering playTrack kay naa man siya gi place sa lugar nga asa ee play ang music
    }
    // this is "global"
    this.downloadState.setDownloading(true);
    const filePath = await this.musicService.downloadTrack(track);
    this.downloadState.setDownloading(false);
    // check if filepath is valid
    if (filePath) {
      this.showToast('Downloaded for offline use!');
    } else {
      this.showToast('Download failed.');
    }

    await this.refreshTrackStates();
  }

  async refreshTrackStates() {
    // Get liked tracks
    const playlist = await this.musicService.getTracksFromStorage('MyPlaylist');
    this.likedTrackIds = new Set(playlist.map((t: any) => t.id));
    // Get downloaded tracks
    const downloads = await this.musicService.getTracksFromStorage('downloads');
    this.downloadedTrackIds = new Set(downloads.map((t: any) => t.id));
  }
}
