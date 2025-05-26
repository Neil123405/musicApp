import { Component, OnInit } from '@angular/core';
import { MusicService } from 'src/app/services/music.service';
import { NavController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-playlists',
  templateUrl: './playlists.page.html',
  styleUrls: ['./playlists.page.scss'],
  standalone: false
})
export class PlaylistsPage implements OnInit {
  array: any[] = [];
  constructor(private musicService: MusicService, private navCtrl: NavController, private toastController: ToastController) { }

  async ngOnInit() {
    // service contains everything related to music
    this.array = await this.musicService.getTracksFromStorage('MyPlaylist');
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      color: 'danger',
      position: 'bottom'
    });
    toast.present();
  }

  playTrack(track: any, name: 'MyPlaylist') {    
    if (this.array) {
      // the music service works with its own copy of the playlist, preventing unintended side effects from direct mutations
      // the name is the key of the object, and the value is an array of objects tracks like  your MyPlaylist
      this.musicService.track = this.array.slice();
      // <-- Track the source or think of it as the name of the key in the object, arrays and object again
      this.musicService.currentKeyName = name; 
    }
    this.musicService.play(track);
    this.navCtrl.navigateForward('/player');
  }

  async removeTrack(track: any, key: 'MyPlaylist') {
    await this.musicService.removeTrackFromNamedKey(track, key);
    // Reload playlists from storage to update UI
    // gets the playlists which are objects, in that function cintains a this.storage that contains the new ones
    this.array = await this.musicService.getTracksFromStorage(key);
    // Update in-memory playlist if needed
    if (this.musicService.track) {
      // gets a copy of the updated playlist, an array of MyPlaylist values
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
      if (!stillExists) {
        await this.showToast('Removed from playlist');
        // Stop playback
        // and nullifies the current track and playlist name
        this.musicService.pause();
        this.musicService.currentTrack = null;
        this.musicService.currentKeyName = null;
      }
    }
  }

}
