import { Component, OnInit } from '@angular/core';
import { MusicService } from 'src/app/services/music.service';
import { NavController } from '@ionic/angular'; 

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
    // service contains everything related to music
    this.playlists = await this.musicService.getPlaylists();
    // extracts keys from the this.playlists object and then stores it in the array
    this.playlistNames = Object.keys(this.playlists);
  }

  playTrack(track: any, name: string) {
    // Set the session playlist to the current playlist for navigation
    if (this.playlists && this.playlists[name]) {
      // the music service works with its own copy of the playlist, preventing unintended side effects from direct mutations
      this.musicService.playlist = this.playlists[name].slice();
      this.musicService.currentPlaylistName = name; // <-- Track the source or think of it as the name of the array
    }
    this.musicService.play(track);
    this.navCtrl.navigateForward('/player');
  }

  // removeTrackFromPlaylist(track: any, playlistName: string) {
  //   // services are used here
  //   this.musicService.removeFromPlaylist(track.id);
  //   // This method saves the updated playlist back to persistent storage under the specified playlist name. 
  //   this.musicService.savePlaylist(playlistName);
  // }

  async removeTrack(track: any, playlistName: string) {
    await this.musicService.removeTrackFromNamedPlaylist(track.id, playlistName);
    // Reload playlists from storage to update UI
    // gets the playlists which are objects, in that function cintains a this.storage that contains the new ones
    this.playlists = await this.musicService.getPlaylists();
    // from the objects contains a key, it gets that key or name and stores it in an array
    this.playlistNames = Object.keys(this.playlists);

    // Update in-memory playlist if needed
    if (
      this.musicService.currentPlaylistName === playlistName &&
      this.musicService.playlist &&
      Array.isArray(this.playlists[playlistName])
    ) {
      // gets a copy of the updated playlist
      this.musicService.playlist = this.playlists[playlistName].slice();
      // If the current track was removed, handle playback
      // - .some(...) is an array method that checks if at least one element in the array matches the condition that is in the Music Playlist
      const stillExists = this.musicService.playlist.some(
        t => t.id === this.musicService.currentTrack?.id
      );
      // If they don't match, the user is listening to a different playlist or a single track, so removing a track from this playlist should not affect the current playback.
      // If they match, it means the user is playing music from that playlist, so any changes (like removing the current track) should affect playback.
      // not stillExists or wala na
      if (!stillExists && this.musicService.currentPlaylistName === playlistName) {
        // Stop playback
        // and nullifies the current track and playlist name
        this.musicService.pause();
        this.musicService.currentTrack = null;
        this.musicService.currentPlaylistName = null;
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
