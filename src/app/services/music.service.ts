import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class MusicService {
  audio = new Audio();
  currentTrack: any = null;
  isPlaying = false;
  track: any[] = [];
  currentKeyName: string | null = null;

  // when a user puts music service in the constructor, it will automatically create the storage
  constructor(private storage: Storage, private http: HttpClient) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
  }

  async play(track: any) {
    if (track.localPath) {
      // Play downloaded track
      const file = await Filesystem.readFile({
        path: track.localPath,
        // indicates that the file should be accessed from the application's data directory
        // every app on a mobile device has its own private data directory
        directory: Directory.Data,
      });
      const audioUrl = `data:audio/mp3;base64,${file.data}`;
      this.audio.src = audioUrl;
    } else {
      // Play streaming/online track
      this.audio.src = track.audio;
    }
    // track array track is TRACKS
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

  async addToPlaylist(track: any, key: string) {
    // Load the playlist from storage first
    let playlist = await this.storage.get(key) || [];
    // checks if wala pay similar sa sulod
    if (!playlist.find((t: any) => t.id === track.id)) {
      // track is the new music
      playlist.push(track);
      await this.storage.set(key, playlist);
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

  async getMyPlaylist(key: string) {
    // const keys = await this.storage.keys();
    // Only include keys that are actual playlists
    // const playlistKeys = key;
    // key => key !== 'test_key' && key !== 'downloads'
    // );
    // object key-value pair
    const playlists: { [key: string]: any } = {};
    // for (let key of playlistKeys) {
    // kwaon ang mga data associated sa key
    playlists[key] = await this.storage.get(key);
    // }
    return playlists;
  }

  //   async getUserPlaylist(key: string): Promise<any[]> {
  //   return (await this.storage.get(key)) || [];
  // }

  // async debugStorage() {
  //   await this.storage.set('test_key', 'Hello Storage');
  //   const result = await this.storage.get('test_key');
  //   console.log('Storage test:', result);
  // }

  /**
   * Remove a track from a named playlist in storage and update storage.
   */
  // filters out the track with the given ID from the playlist and updates the storage
  async removeTrackFromNamedKey(track: any, key: string) {
    try {
      if (key === 'downloads' && track.localPath) {
        // Remove the file from the filesystem
        try {
          await Filesystem.deleteFile({
            path: track.localPath,
            directory: Directory.Data,
          });
        } catch (e: any) {
          // Ignore file not found errors
          if (!e?.message?.includes('not found')) {
            throw e;
          }
        }
      }

      // Remove the track info from the specified key in storage
      let list = await this.storage.get(key) || [];
      list = list.filter((t: any) => t.id !== track.id);
      await this.storage.set(key, list);

      return true;
    } catch (err) {
      console.error('Remove failed', err);
      return false;
    }
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
  // async getTracksFromStorage('downloads'): Promise<any[]> {
  //   return (await this.storage.get('downloads')) || [];
  // }

  async getTracksFromStorage(key: string): Promise<any[]> {
    return (await this.storage.get(key)) || [];
  }

  // // Play a downloaded track
  // async playDownloadedTrack(track: any) {
  //   const file = await Filesystem.readFile({
  //     path: track.localPath,
  //     directory: Directory.Data,
  //   });
  //   // Create a blob URL for the audio
  //   const audioUrl = `data:audio/mp3;base64,${file.data}`;
  //   this.audio.src = audioUrl;
  //   this.audio.load();
  //   this.audio.play();
  //   this.currentTrack = track;
  //   this.isPlaying = true;
  // }

  //  async deleteDownloadedTrack(track: any): Promise<boolean> {
  //   try {
  //     // Remove the file from the filesystem
  //     await Filesystem.deleteFile({
  //       path: track.localPath,
  //       directory: Directory.Data,
  //     });

  //     // Remove the track info from 'downloads' in storage
  //     let downloads = await this.storage.get('downloads') || [];
  //     downloads = downloads.filter((t: any) => t.id !== track.id);
  //     await this.storage.set('downloads', downloads);

  //     return true;
  //   } catch (err) {
  //     console.error('Delete failed', err);
  //     return false;
  //   }
  // }

  getTracksFromApi(query: string = '', clientId: string = ''): Promise<any[]> {
    // safely encodes the query para dili mag issue sa mga special characters 
    const encodedQuery = encodeURIComponent(query || '');
    // clientId is for authorization; returns a response in json format; restricts the limit to 20 tracks based on the provided query
    // Jamendo has approximately 600000 songs use this for randomization but warning it is slow
    // const randomOffset = Math.floor(Math.random() * 10000);
    // https://developer.jamendo.com/v3.0/tracks
    // orders = duration or random for fast load
    let url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=20&order=popularity_month`;
    if (encodedQuery) {
      url += `&namesearch=${encodedQuery}`;
    }
    // sends GET request to the Jamendo API, and then subscribe ensures that once the response is received the function will execute
    return this.http.get<any>(url).toPromise().then(res => res.results);
  }

}
