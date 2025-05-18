import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MusicService } from 'src/app/services/music.service';
import { NavController, ToastController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
  suggestions: string[] = [];

  constructor(
    private http: HttpClient,
    public musicService: MusicService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.searchTracks(''); // Only load from API, never add extra tracks
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 1200, color: 'primary' });
    toast.present();
    Haptics.impact({ style: ImpactStyle.Medium });
  }

  searchTracks(query: string) {
    const encodedQuery = encodeURIComponent(query || '');
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${this.clientId}&format=json&limit=20&namesearch=${encodedQuery}`;
    this.http.get(url).subscribe((res: any) => {
      // Always replace the tracks array with API results only
      this.tracks = res.results;
      this.suggestions = this.tracks.map(t => t.name).slice(0, 5);
    });
  }

  onSearch(event: any) {
    const val = event.detail.value;
    this.searchQuery = val;
    this.searchTracks(val); // fetch new results as user types
  }

  doRefresh(event: any) {
    this.searchTracks(this.searchQuery);
    setTimeout(() => {
      event.target.complete();
    }, 800);
  }

  playTrack(track: any) {
    this.currentIndex = this.tracks.findIndex(t => t.id === track.id);
    this.musicService.playlist = this.tracks;
    this.musicService.play(track);
    this.navCtrl.navigateForward('/player');
    this.showToast(`Playing: ${track.name}`);
  }

  playNext() {
    if (this.currentIndex >= 0 && this.currentIndex < this.tracks.length - 1) {
      this.currentIndex++;
      const nextTrack = this.tracks[this.currentIndex];
      this.musicService.play(nextTrack);
      this.showToast(`Playing: ${nextTrack.name}`);
    }
  }

  playPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const prevTrack = this.tracks[this.currentIndex];
      this.musicService.play(prevTrack);
      this.showToast(`Playing: ${prevTrack.name}`);
    }
  }

  openAddTrackModal() {
    this.showToast('Add Track coming soon!');
  }

  async addToPlaylist(track: any, event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevent triggering playTrack
    }
    await this.musicService.addToPlaylist(track, 'MyPlaylist');
    this.showToast(`Added to Playlist: ${track.name}`);
  }
}
