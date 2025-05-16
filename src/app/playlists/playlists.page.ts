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
  }

}
