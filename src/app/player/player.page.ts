import { Component, OnInit, OnDestroy } from '@angular/core';
import { MusicService } from 'src/app/services/music.service';
import { ToastController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DownloadStateService } from '../services/download-state.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.page.html',
  styleUrls: ['./player.page.scss'],
  standalone: false
})
export class PlayerPage implements OnInit, OnDestroy {
  currentTime = 0;
  duration = 0;
  isSeeking = false;
  interval: any;
    isDownloading = false;
    downloadedTracks: any[] = [];
    isInPlaylist = false;


  constructor(public musicService: MusicService, private toastController: ToastController, private downloadState: DownloadStateService,) {}

  async ngOnInit() {
    this.attachAudioEvents();
    this.updateTimes();
    // sets up a repeating timer using setInterval() to call this.updateTimes() every 500 milliseconds (0.5 seconds). 
    this.interval = setInterval(() => this.updateTimes(), 500);
    // LISTENS when the track finishes
    this.musicService.audio.addEventListener('ended', this.onAudioEnded);

    // Only load persistent playlist if there is no session playlist
    // persistence for music storage
    // if (!this.musicService.track || this.musicService.track.length === 0) {
    //   const loaded = await this.musicService.getPlaylistFromStorage('MyPlaylist');
    //   if (Array.isArray(loaded)) {
    //     this.musicService.track = loaded;
    //   }
    // }
    this.downloadedTracks = await this.musicService.getTracksFromStorage('downloads');
    await this.updateIsInPlaylist();
  }
  async updateIsInPlaylist() {
    const userPlaylist = await this.musicService.getTracksFromStorage('MyPlaylist');
  this.isInPlaylist = !!userPlaylist.find(t => t.id === this.musicService.currentTrack.id);
}


  // for ending
  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.detachAudioEvents();
    this.musicService.audio.removeEventListener('ended', this.onAudioEnded);
  }

  onAudioEnded = () => {
    this.musicService.isPlaying = false;
  }

  attachAudioEvents() {
    const audio = this.musicService.audio;
    // fires continuously as playback progresses
    // everytime there is a time update, it will call the function and change the current time and duration for the UI
    audio.addEventListener('timeupdate', this.updateTimesBound);
    // fires when audio metadata (duration, format, title, artist) is loaded
    audio.addEventListener('loadedmetadata', this.updateTimesBound);
  }

  detachAudioEvents() {
    const audio = this.musicService.audio;
    audio.removeEventListener('timeupdate', this.updateTimesBound);
    audio.removeEventListener('loadedmetadata', this.updateTimesBound);
  }
  // Using updateTimesBound keeps a single reference, making removeEventListener and addEventListener work properly
  // it ensures that when the event fires, this still refers to the original class instance rather than getting lost or reassigned.
  updateTimesBound = () => this.updateTimes();
  // loop loop
  updateTimes() {
    // gets the audio
    const audio = this.musicService.audio;
    // gets the current time and duration of the audio
    this.currentTime = audio.currentTime || 0;
    this.duration = audio.duration || 0;
  }

  onSliderChange(event: any) {
    const value = event.detail.value;
    // gets the audio element from the service
    // objects (including the Audio element) are assigned and passed by reference, not by value.
    const audio = this.musicService.audio;
    // Sets audio.currentTime to value, changing the playback position. both service and player audio
    audio.currentTime = value;
    this.currentTime = value;
    // this.isSeeking = false;
    // Resume playback if not at the end and audio is paused after sliding it
    // if (audio.paused && value < (audio.duration || 0)) {
    //   audio.play();
    //   this.musicService.isPlaying = true;
    // }
  }

  // onSliderStart() {
  //   this.isSeeking = true;
  // }

  // onSliderEnd(event: any) {
  //   this.onSliderChange(event);
  //   this.isSeeking = false;
  // }

  formatTime(sec: number): string {
    if (!isFinite(sec)) return '0:00';
    // convert seconds to minutes
    const m = Math.floor(sec / 60);
    // get the remaining seconds
    const s = Math.floor(sec % 60);
    // Format the Time String minutes:seconds. if less than 10 seconds, add a leading zero
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  togglePlayback() {
    // toggle sa service
    this.musicService.togglePlay();
  }

  // similar sa home.page.ts
  async showToast(msg: string) {
    const toast = await this.toastController.create({ message: msg, duration: 1200, color: 'primary' });
    toast.present();
    Haptics.impact({ style: ImpactStyle.Medium });
  }

  async saveCurrentToPlaylist() {
    // gets the current track from the service, it was set pag play sa general track
    const track = this.musicService.currentTrack;
    if (track) {
      // adds it using the service
      await this.musicService.addToPlaylist(track, 'MyPlaylist');
      // gets the playlist and put it in a variable to use
      // const playlists = await this.musicService.getTracksFromStorage(key);
      this.showToast(`Added to Playlist: ${track.name}`);
      await this.updateIsInPlaylist(); // Update the heart icon state
    }
  }

  async playNext() {
    const idx = this.getCurrentTrackIndex();
  if (
    this.musicService.track &&
    idx < this.musicService.track.length - 1
  ) {
    const nextTrack = this.musicService.track[idx + 1];
    if (this.musicService.currentKeyName === 'downloads') {
      this.musicService.play(nextTrack);
    } else {
      this.musicService.play(nextTrack);
    }
    this.musicService.currentTrack = nextTrack;
    await this.updateIsInPlaylist(); // <-- Update heart state
  }
  }

  // just the opposite of playNext()
  async playPrevious() {
    const idx = this.getCurrentTrackIndex();
  if (this.musicService.track && idx > 0) {
    const prevTrack = this.musicService.track[idx - 1];
    if (this.musicService.currentKeyName === 'downloads') {
      this.musicService.play(prevTrack);
    } else {
      this.musicService.play(prevTrack);
    }
    this.musicService.currentTrack = prevTrack;
    await this.updateIsInPlaylist(); // <-- Update heart state
  }
  }

  getCurrentTrackIndex(): number {
  if (
    !this.musicService.track ||
    !this.musicService.currentTrack
  ) {
    return -1;
  }
  // finds the index of the current track and returns it to check whether it is zero or last
  return this.musicService.track.findIndex(
    t => t.id === this.musicService.currentTrack.id
  );
}

  isFirstTrack(): boolean {
    return this.getCurrentTrackIndex() === 0;
  }

  isLastTrack(): boolean {
    return (
      this.musicService.track &&
      this.getCurrentTrackIndex() === this.musicService.track.length - 1
    );
  }

async downloadCurrentTrack(track: any) {
   if (track) {
      this.downloadState.setDownloading(true);
      const filePath = await this.musicService.downloadTrack(track);
      this.downloadState.setDownloading(false);
      if (filePath) {
        this.downloadedTracks = await this.musicService.getTracksFromStorage('downloads');
        this.showToast('Downloaded for offline use!');
      } else {
        this.showToast('Download failed.');
      }
    }
}

async isCurrentTrackInPlaylist(): Promise<boolean> {
  if (!this.musicService.currentTrack) return false;
  const userPlaylist = await this.musicService.getTracksFromStorage('MyPlaylist');
  return userPlaylist.some(t => t.id === this.musicService.currentTrack.id);
}

isCurrentTrackDownloaded(): boolean {
  if (!this.musicService.currentTrack) return false;
  return this.downloadedTracks.some(
    t => t.id === this.musicService.currentTrack.id
  );
}
}
