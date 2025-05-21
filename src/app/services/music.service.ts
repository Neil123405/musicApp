import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class MusicService {
  audio = new Audio();
  currentTrack: any = null;
  isPlaying = false;
  playlist: any[] = [];
  currentPlaylistName: string | null = null;

  constructor(private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
  }

  play(track: any) {
    this.audio.src = track.audio;
    this.audio.load();
    this.audio.play();
    this.currentTrack = track;
    this.isPlaying = true;
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      // simple play and pause
      this.audio.play();
      this.isPlaying = true;
    }
  }

  async addToPlaylist(track: any, playlistName: string = 'MyPlaylist') {
    // Load the playlist from storage first
    let playlist = await this.storage.get(playlistName) || [];
    // checks if wala pay similar sa sulod
    if (!playlist.find((t: any) => t.id === track.id)) {
      // track is the new music
      playlist.push(track);
      await this.storage.set(playlistName, playlist);
    }
    // Also update in-memory playlist if needed
    //this.playlist = playlist;
  }
  // async updatePlaylist(playlistName: string, tracks: any[]): Promise<void> {
  //       // Update the playlist in storage
  //       // Example using localStorage:
  //       const playlists = JSON.parse(localStorage.getItem('playlists') || '{}');
  //       playlists[playlistName] = tracks;
  //       localStorage.setItem('playlists', JSON.stringify(playlists));
  //       // If you use another storage mechanism, update accordingly
  //   }

  // removeFromPlaylist(trackId: any) {
  //   this.playlist = this.playlist.filter(t => t.id !== trackId);
  // }

  async savePlaylist(name: string) {
    // Save the current in-memory playlist to storage
    await this.storage.set(name, this.playlist);
  }

  async getPlaylists() {
    const keys = await this.storage.keys();
    // Only include keys that are actual playlists
    const playlistKeys = keys.filter(
      key => key !== 'test_key'
    );
    // object key-value pair
    const playlists: { [key: string]: any } = {};
    for (let key of playlistKeys) {
      playlists[key] = await this.storage.get(key);
    }
    return playlists;
  }

  // async debugStorage() {
  //   await this.storage.set('test_key', 'Hello Storage');
  //   const result = await this.storage.get('test_key');
  //   console.log('Storage test:', result);
  // }

  /**
   * Remove a track from a named playlist in storage and update storage.
   */
  // filters out the track with the given ID from the playlist and updates the storage
  async removeTrackFromNamedPlaylist(trackId: any, playlistName: string) {
    const playlist = (await this.storage.get(playlistName)) || [];
    const updated = playlist.filter((t: any) => t.id !== trackId);
    await this.storage.set(playlistName, updated);
  }

  //  async getPlaylistFromStorage(key: string): Promise<any[]> {
  //   const data = localStorage.getItem(key);
  //   return data ? JSON.parse(data) : [];
  // }

  async clearAllStorage() {
    await this.storage.clear();
  }

}
