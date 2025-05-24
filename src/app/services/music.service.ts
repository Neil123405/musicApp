import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

@Injectable({ providedIn: 'root' })
export class MusicService {
  audio = new Audio();
  currentTrack: any = null;
  isPlaying = false;
  playlist: any[] = [];
  currentPlaylistName: string | null = null;

  // when a user puts music service in the constructor, it will automatically create the storage
  constructor(private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
  }

  play(track: any) {
    // track array track is TRACKS
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

  // async savePlaylist(name: string) {
  //   // Save the current in-memory playlist to storage
  //   await this.storage.set(name, this.playlist);
  // }

  async getPlaylists() {
    const keys = await this.storage.keys();
    // Only include keys that are actual playlists
    const playlistKeys = keys.filter(
      key => key !== 'test_key' && key !== 'downloads'
    );
    // object key-value pair
    const playlists: { [key: string]: any } = {};
    for (let key of playlistKeys) {
      // kwaon ang mga data associated sa key
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

  // Save downloaded track info in storage under 'downloads'
  async saveDownloadedTrackInfo(track: any, filePath: string) {
    let downloads = await this.storage.get('downloads') || [];
    // Avoid duplicates
    if (!downloads.find((t: any) => t.id === track.id)) {
      downloads.push({ ...track, localPath: filePath });
      await this.storage.set('downloads', downloads);
    }
  }

  // Download and save music file locally
  async downloadTrack(track: any): Promise<string | null> {
    try {
      console.log('Downloading:', track.audio);
    const response = await fetch(track.audio);
    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return null;
    }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = this.arrayBufferToBase64(arrayBuffer);

      const fileName = `track_${track.id}.mp3`;
      const folder = 'music';
    const filePath = `${folder}/${fileName}`;

     try {
      await Filesystem.mkdir({
        path: folder,
        directory: Directory.Data,
        recursive: true,
      });
    } catch (e: any) {
      // Ignore error if folder already exists
      if (!e?.message?.includes('exists')) {
        console.warn('mkdir error:', e);
      }
    }

      await Filesystem.writeFile({
        path: filePath,
        data: base64,
        directory: Directory.Data,
      });

      await this.saveDownloadedTrackInfo(track, filePath);
      return filePath;
    } catch (err) {
      console.error('Download failed', err);
      return null;
    }
  }

  // Helper to convert ArrayBuffer to Base64
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Get all downloaded tracks
  async getDownloadedTracks(): Promise<any[]> {
    return (await this.storage.get('downloads')) || [];
  }

  // Play a downloaded track
  async playDownloadedTrack(track: any) {
    const file = await Filesystem.readFile({
      path: track.localPath,
      directory: Directory.Data,
    });
    // Create a blob URL for the audio
    const audioUrl = `data:audio/mp3;base64,${file.data}`;
    this.audio.src = audioUrl;
    this.audio.load();
    this.audio.play();
    this.currentTrack = track;
    this.isPlaying = true;
  }

   async deleteDownloadedTrack(track: any): Promise<boolean> {
    try {
      // Remove the file from the filesystem
      await Filesystem.deleteFile({
        path: track.localPath,
        directory: Directory.Data,
      });

      // Remove the track info from 'downloads' in storage
      let downloads = await this.storage.get('downloads') || [];
      downloads = downloads.filter((t: any) => t.id !== track.id);
      await this.storage.set('downloads', downloads);

      return true;
    } catch (err) {
      console.error('Delete failed', err);
      return false;
    }
  }

}
