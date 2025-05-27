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
      // Data URLs are composed of four parts: a prefix (data:), a MIME type indicating the type of data, an optional base64 token if non-textual, and the data itself:
      // data:[<media-type>][;base64],<data> thhis is the syntax for data URLs
      // https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data
      const audioUrl = `data:audio/mp3;base64,${file.data}`;
      // src is a property instance of HTMLMediaElement that accepts string
      // https://www.javascripture.com/HTMLMediaElement
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
  }

  // filters out the track with the given ID from the playlist and updates the storage
  async removeTrackFromNamedKey(track: any, key: string) {
    try {
      if (key === 'downloads' && track.localPath) {
        // Remove the file from the filesystem
        // https://capacitorjs.com/docs/apis/filesystem#readfile
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

  async clearAllStorage() {
    await this.storage.clear();
  }

  // Save downloaded track info in storage under 'downloads'
  async saveDownloadedTrackInfo(track: any, filePath: string) {
    // https://github.com/ionic-team/ionic-storage
    // the get for ionic storage returns a promise, so we need to await it
    let downloads = await this.storage.get('downloads') || [];
    // Avoid duplicates
    if (!downloads.find((t: any) => t.id === track.id)) {
      downloads.push({ ...track, localPath: filePath });
      // https://github.com/ionic-team/ionic-storage
      await this.storage.set('downloads', downloads);
    }
  }

  // Download and save music file locally
  async downloadTrack(track: any): Promise<string | null> {
    try {
      // track.audio and things came from the Jamendo API
      console.log('Downloading:', track.audio);
      const response = await fetch(track.audio);
      if (!response.ok) {
        console.error('Fetch failed:', response.status, response.statusText);
        return null;
      }
      // converts the link or http to blob object, which is a generic representation of binary data.
      const blob = await response.blob();
      // converts to low-level binary data to manipulate the data into a different format, which allows you to access the raw bytes of the file.
      const arrayBuffer = await blob.arrayBuffer();
      // represent binary data as text, making it easier to store or transmit, especially when saving to storage or embedding in data URLs. 
      // in simple terms, it converts the blob or binary data into a Base64 string, which is required for saving files in the storage and playing the audio 
      const base64 = this.arrayBufferToBase64(arrayBuffer);

      const fileName = `track_${track.id}.mp3`;
      const folder = 'music';
      const filePath = `${folder}/${fileName}`;

      try {
        // https://capacitorjs.com/docs/apis/filesystem#mkdiroptions
        await Filesystem.mkdir({
          path: folder,
          // is a constant provided by Capacitor's Filesystem API that refers to the app's private data directory on the device. This is a secure, sandboxed folder where your app can store files (like downloaded music) that are not accessible by other apps and are deleted when the app is uninstalled.
          directory: Directory.Data,
          recursive: true,
        });
      } catch (e: any) {
        // Ignore error if folder already exists
        if (!e?.message?.includes('exists')) {
          console.warn('mkdir error:', e);
        }
      }
      // https://capacitorjs.com/docs/apis/filesystem#writefileoptions
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
  // just copied from the internet
  // ArrayBuffer - a low-level, fixed-length binary data buffer in JavaScript
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binaryString = '';
    // allows you to access each byte as an integer.
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    // BASE 64 - The Capacitor Filesystem API (and many web/mobile storage solutions) often require file data to be in a string format when saving to storage.
    // converts binary string into base 64 and used in contexts that require textxtual representation of binary data
    return btoa(binaryString);
  }

  async getTracksFromStorage(key: string): Promise<any[]> {
    return (await this.storage.get(key)) || [];
  }

  getTracksFromApi(query: string = '', clientId: string = ''): Promise<any[]> {
    // safely encodes the query para dili mag issue sa mga special characters, more importantly it is for URL
    const encodedQuery = encodeURIComponent(query || '');
    // clientId is for authorization; returns a response in json format; restricts the limit to 20 tracks based on the provided query or order
    // Jamendo has approximately 600000 songs use this for randomization warning it is slow if you have no order
    // https://developer.jamendo.com/v3.0/tracks
    let url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=20&order=popularity_month`;
    if (encodedQuery) {
      url += `&namesearch=${encodedQuery}`;
    }
    // sends GET request to the Jamendo API, and then subscribe ensures that once the response is received the function will execute
    // .toPromise() when you only need one value (e.g., fetching API data once)
    return this.http.get<any>(url).toPromise().then(res => res.results);
  }

}
