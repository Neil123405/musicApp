import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MusicService } from 'src/app/services/music.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  tracks: any[] = [];
  clientId = '0f6f38b8'; // Replace this with your Jamendo API key
  currentIndex: number = -1;

  constructor(
    private http: HttpClient,
    private musicService: MusicService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.musicService.debugStorage(); // 🔍 Should log "Hello Storage"
    this.searchTracks(''); // load default list
  }

  searchTracks(query: string) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${this.clientId}&format=json&limit=20&namesearch=${encodedQuery}`;
    
    this.http.get(url).subscribe((res: any) => {
      this.tracks = res.results;
    });
  }

  onSearch(event: any) {
    const val = event.detail.value;
    this.searchTracks(val);
  }

  playTrack(track: any) {
    this.currentIndex = this.tracks.findIndex(t => t.id === track.id);
    this.musicService.playlist = this.tracks;
    this.musicService.play(track);
    this.navCtrl.navigateForward('/player');
  }

  playNext() {
    if (this.currentIndex >= 0 && this.currentIndex < this.tracks.length - 1) {
      this.currentIndex++;
      const nextTrack = this.tracks[this.currentIndex];
      this.musicService.play(nextTrack);
    }
  }

  playPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const prevTrack = this.tracks[this.currentIndex];
      this.musicService.play(prevTrack);
    }
  }
}
