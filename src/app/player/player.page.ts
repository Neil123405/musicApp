import { Component } from '@angular/core';
import { MusicService } from 'src/app/services/music.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.page.html',
  styleUrls: ['./player.page.scss'],
  standalone: false
})
export class PlayerPage {
  constructor(public musicService: MusicService) {}

  togglePlayback() {
    this.musicService.togglePlay();
  }

  saveCurrentToPlaylist() {
  const track = this.musicService.currentTrack;
  if (track) {
    this.musicService.addToPlaylist(track);
    this.musicService.savePlaylist('MyPlaylist').then(() => {
      this.musicService.getPlaylists().then((playlists) => {
        console.log('✅ Saved playlist:', playlists['MyPlaylist']);
      });
    });
  }
}


}
