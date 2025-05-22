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
  // array of any type
  tracks: any[] = [];
  clientId = '0f6f38b8';
  currentIndex: number = -1;
  searchQuery = '';
  // suggestions: string[] = [];

  constructor(
    private http: HttpClient,
    public musicService: MusicService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.searchTracks(''); // load diritso ang mga tracks 
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 1200, color: 'primary' });
    toast.present();
    // vibrate
    Haptics.impact({ style: ImpactStyle.Medium });
  }

  searchTracks(query: string) {
    // safely encodes the query para dili mag issue sa mga special characters 
    const encodedQuery = encodeURIComponent(query || '');
    // clientId is for authorization; returns a response in json format; restricts the limit to 20 tracks based on the provided query
    // Jamendo has approximately 600000 songs use this for randomization but warning it is slow
    // const randomOffset = Math.floor(Math.random() * 10000);
    // https://developer.jamendo.com/v3.0/tracks
    // orders = duration or random for fast load
    let url = `https://api.jamendo.com/v3.0/tracks/?client_id=${this.clientId}&format=json&limit=20&orders=listens_week`;
    if (encodedQuery) {
    url += `&namesearch=${encodedQuery}`;
    }
    // sends GET request to the Jamendo API, and then subscribe ensures that once the response is received the function will execute
    this.http.get(url).subscribe((res: any) => {
      // updates the tracks with results from the API
      this.tracks = res.results;
      // extracts the track names from the results and limits the suggestions to 5
      // this.suggestions = this.tracks.map(t => t.name).slice(0, 5);
    });
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
    this.musicService.playlist = this.tracks;
    // By setting currentPlaylistName to null, it indicates that the user is not playing from a named playlist or saved playlist, but rather from the general track list.
    this.musicService.currentPlaylistName = null;
    // ee call ang service para mag play ug sound
    this.musicService.play(track);
    // navigate ra ni siya 
    this.navCtrl.navigateForward('/player');
    // toaste notif
    this.showToast(`Playing: ${track.name}`);
  }

  // playNext() {
  //   if (this.currentIndex >= 0 && this.currentIndex < this.tracks.length - 1) {
  //     this.currentIndex++;
  //     const nextTrack = this.tracks[this.currentIndex];
  //     this.musicService.play(nextTrack);
  //     this.showToast(`Playing: ${nextTrack.name}`);
  //   }
  // }

  // playPrevious() {
  //   if (this.currentIndex > 0) {
  //     this.currentIndex--;
  //     const prevTrack = this.tracks[this.currentIndex];
  //     this.musicService.play(prevTrack);
  //     this.showToast(`Playing: ${prevTrack.name}`);
  //   }
  // }

  // openAddTrackModal() {
  //   this.showToast('Add Track coming soon!');
  // }

  async addToPlaylist(track: any, event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevent triggering playTrack kay naa man siya gi place sa lugar nga asa ee play ang music
    }
    // calls the service function
    await this.musicService.addToPlaylist(track, 'MyPlaylist');
    this.showToast(`Added to Playlist: ${track.name}`);
  }
}
