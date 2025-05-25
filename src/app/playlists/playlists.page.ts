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
  array: any[] = [];
  // keyNames: string[] = [];

  constructor(private musicService: MusicService, private navCtrl: NavController) {}

  async ngOnInit() {
    // service contains everything related to music
    this.array = await this.musicService.getTracksFromStorage('MyPlaylist');
    // extracts keys from the this.playlists object and then stores it in the array
    // this.keyNames = Object.keys(this.array);
  }

  playTrack(track: any, name: 'MyPlaylist') {
    // Set the session playlist to the current playlist for navigation
    if (this.array) {
      // the music service works with its own copy of the playlist, preventing unintended side effects from direct mutations
      // the name is the key of the object, and the value is an array of objects tracks like  your MyPlaylist
      this.musicService.track = this.array.slice();
      this.musicService.currentKeyName = name; // <-- Track the source or think of it as the name of the key in the object, arrays and object again
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

  async removeTrack(track: any, key: 'MyPlaylist') {
    await this.musicService.removeTrackFromNamedKey(track, key);
    // Reload playlists from storage to update UI
    // gets the playlists which are objects, in that function cintains a this.storage that contains the new ones
    this.array = await this.musicService.getTracksFromStorage(key);
    // from the objects contains a key, it gets that keys or name and stores it in an array
    // this.keyNames = Object.keys(this.array);

    // Update in-memory playlist if needed
    if (
      /* this.musicService.currentKeyName === key && */
      this.musicService.track /* &&
      Array.isArray(this.array) */
    ) {
      // gets a copy of the updated playlist, an array of track objects
      // the name is the key of the object, and the value is an array of objects tracks like  your MyPlaylist
      this.musicService.track = this.array.slice();
      // If the current track was removed, handle playback
      // - .some(...) is an array method that checks if at least one element in the array matches the condition that is in the Music Playlist
      const stillExists = this.musicService.track.some(
        t => t.id === this.musicService.currentTrack?.id
      );
      // If they don't match, the user is listening to a different playlist or a single track, so removing a track from this playlist should not affect the current playback.
      // If they match, it means the user is playing music from that playlist, so any changes (like removing the current track) should affect playback.
      // not stillExists or wala na or NOT EXISTS THEN WALA SA PLAYLIST
      if (!stillExists /* && this.musicService.currentKeyName === key */) {
        // Stop playback
        // and nullifies the current track and playlist name
        this.musicService.pause();
        this.musicService.currentTrack = null;
        this.musicService.currentKeyName = null;
        // Option 2: Play next track if available
        // if (this.musicService.track.length > 0) {
        //   this.musicService.play(this.musicService.track[0]);
        // } else {
        //   this.musicService.pause();
        //   this.musicService.currentTrack = null;
        // }
      }
    }
  }

}
