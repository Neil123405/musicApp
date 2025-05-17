import { Component, OnInit } from '@angular/core';
import { MusicService } from 'src/app/services/music.service';
import { NavController } from '@ionic/angular'; // 👈 import this

@Component({
  selector: 'app-playlists',
  templateUrl: './playlists.page.html',
  styleUrls: ['./playlists.page.scss'],
  standalone: false
})
export class PlaylistsPage implements OnInit {
  playlists: any = {};
  playlistNames: string[] = [];

  constructor(private musicService: MusicService, private navCtrl: NavController) {}

  async ngOnInit() {
    this.playlists = await this.musicService.getPlaylists();
    this.playlistNames = Object.keys(this.playlists);
  }

  playTrack(track: any, name: string) {
    // Set the session playlist to the current playlist for navigation
    if (this.playlists && this.playlists[name]) {
      this.musicService.playlist = this.playlists[name].slice();
    }
    this.musicService.play(track);
    this.navCtrl.navigateForward('/player'); // 👈 go to player page
  }

  removeTrackFromPlaylist(track: any, playlistName: string) {
    this.musicService.removeFromPlaylist(track.id);
    this.musicService.savePlaylist(playlistName).then(() => {
      // Optionally refresh playlists or update UI
    });
  }

  async removeTrack(track: any, playlistName: string) {
    await this.musicService.removeTrackFromNamedPlaylist(track.id, playlistName);
    // Reload playlists from storage to update UI
    this.playlists = await this.musicService.getPlaylists();
    this.playlistNames = Object.keys(this.playlists);

    // Update in-memory playlist if needed
    if (
      this.musicService.playlist &&
      Array.isArray(this.playlists[playlistName])
    ) {
      this.musicService.playlist = this.playlists[playlistName].slice();
      // If the current track was removed, handle playback
      const stillExists = this.musicService.playlist.some(
        t => t.id === this.musicService.currentTrack?.id
      );
      if (!stillExists) {
        // Option 1: Stop playback
        this.musicService.pause();
        this.musicService.currentTrack = null;
        // Option 2: Play next track if available
        // if (this.musicService.playlist.length > 0) {
        //   this.musicService.play(this.musicService.playlist[0]);
        // } else {
        //   this.musicService.pause();
        //   this.musicService.currentTrack = null;
        // }
      }
    }
  }

}
