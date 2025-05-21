import { Component, OnInit, OnDestroy } from '@angular/core';
import { MusicService } from 'src/app/services/music.service';
import { ToastController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

  constructor(public musicService: MusicService, private toastController: ToastController) {}

  async ngOnInit() {
    this.attachAudioEvents();
    this.updateTimes();
    // sets up a repeating timer using setInterval() to call this.updateTimes() every 500 milliseconds (0.5 seconds). 
    this.interval = setInterval(() => this.updateTimes(), 500);
    // LISTENS when the track finishes
    this.musicService.audio.addEventListener('ended', this.onAudioEnded);

    // Only load persistent playlist if there is no session playlist
    // persistence for music storage
    if (!this.musicService.playlist || this.musicService.playlist.length === 0) {
      const loaded = await this.musicService.getPlaylistFromStorage('MyPlaylist');
      if (Array.isArray(loaded)) {
        this.musicService.playlist = loaded;
      }
    }
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
    const audio = this.musicService.audio;
    // Sets audio.currentTime to value, changing the playback position.
    audio.currentTime = value;
    this.currentTime = value;
    this.isSeeking = false;
    // Resume playback if not at the end and audio is paused
    if (audio.paused && value < (audio.duration || 0)) {
      audio.play();
      this.musicService.isPlaying = true;
    }
  }

  onSliderStart() {
    this.isSeeking = true;
  }

  onSliderEnd(event: any) {
    this.onSliderChange(event);
    this.isSeeking = false;
  }

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
    // gets the current track from the service
    const track = this.musicService.currentTrack;
    if (track) {
      // adds it using the service
      await this.musicService.addToPlaylist(track, 'MyPlaylist');
      // gets the playlist and put it in a variable to use
      const playlists = await this.musicService.getPlaylists();
      this.showToast(`Added to Playlist: ${track.name}`);
    }
  }

  playNext() {
    // kwaon ang mga playlist sa service mismo kung wala aw mu execute nang pinaka una nga if
    const playlist = this.musicService.playlist;
    // kwaon ang current track sa service
    const current = this.musicService.currentTrack;
    if (!playlist || !current) return;
    // mura siya ug loop hagntod makita ang music gi pili nimo
    const idx = playlist.findIndex(t => t.id === current.id);
    // dapat dili zero or last track kung gusto ka maka next
    if (idx >= 0 && idx < playlist.length - 1) {
      this.musicService.play(playlist[idx + 1]);
    }
  }

  // just the opposite of playNext()
  playPrevious() {
    const playlist = this.musicService.playlist;
    const current = this.musicService.currentTrack;
    if (!playlist || !current) return;
    const idx = playlist.findIndex(t => t.id === current.id);
    if (idx > 0) {
      this.musicService.play(playlist[idx - 1]);
    }
  }

  getCurrentTrackIndex(): number {
  if (
    !this.musicService.playlist ||
    !this.musicService.currentTrack
  ) {
    return -1;
  }
  // finds the index of the current track and returns it to check whether it is zero or last
  return this.musicService.playlist.findIndex(
    t => t.id === this.musicService.currentTrack.id
  );
}

  isFirstTrack(): boolean {
    return this.getCurrentTrackIndex() === 0;
  }

  isLastTrack(): boolean {
    return (
      this.musicService.playlist &&
      this.getCurrentTrackIndex() === this.musicService.playlist.length - 1
    );
  }
}
