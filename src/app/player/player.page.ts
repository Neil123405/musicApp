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
    this.interval = setInterval(() => this.updateTimes(), 500);
    this.musicService.audio.addEventListener('ended', this.onAudioEnded);

    // Only load persistent playlist if there is no session playlist
    if (!this.musicService.playlist || this.musicService.playlist.length === 0) {
      const loaded = await this.musicService.getPlaylistFromStorage('MyPlaylist');
      if (Array.isArray(loaded)) {
        this.musicService.playlist = loaded;
      }
    }
  }

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
    audio.addEventListener('timeupdate', this.updateTimesBound);
    audio.addEventListener('loadedmetadata', this.updateTimesBound);
  }

  detachAudioEvents() {
    const audio = this.musicService.audio;
    audio.removeEventListener('timeupdate', this.updateTimesBound);
    audio.removeEventListener('loadedmetadata', this.updateTimesBound);
  }

  updateTimesBound = () => this.updateTimes();

  updateTimes() {
    const audio = this.musicService.audio;
    this.currentTime = audio.currentTime || 0;
    this.duration = audio.duration || 0;
  }

  onSliderChange(event: any) {
    const value = event.detail.value;
    const audio = this.musicService.audio;
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
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  togglePlayback() {
    this.musicService.togglePlay();
  }

  async showToast(msg: string) {
    const toast = await this.toastController.create({ message: msg, duration: 1200, color: 'primary' });
    toast.present();
    Haptics.impact({ style: ImpactStyle.Medium });
  }

  async saveCurrentToPlaylist() {
    const track = this.musicService.currentTrack;
    if (track) {
      await this.musicService.addToPlaylist(track, 'MyPlaylist');
      const playlists = await this.musicService.getPlaylists();
      console.log('✅ Saved playlist:', playlists['MyPlaylist']);
      this.showToast(`Added to Playlist: ${track.name}`);
    }
  }

  playNext() {
    const playlist = this.musicService.playlist;
    const current = this.musicService.currentTrack;
    if (!playlist || !current) return;
    const idx = playlist.findIndex(t => t.id === current.id);
    if (idx >= 0 && idx < playlist.length - 1) {
      this.musicService.play(playlist[idx + 1]);
    }
  }

  playPrevious() {
    const playlist = this.musicService.playlist;
    const current = this.musicService.currentTrack;
    if (!playlist || !current) return;
    const idx = playlist.findIndex(t => t.id === current.id);
    if (idx > 0) {
      this.musicService.play(playlist[idx - 1]);
    }
  }
}
