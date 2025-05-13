import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class MusicService {
  audio = new Audio();
  currentTrack: any = null;
  isPlaying = false;
  playlist: any[] = [];

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
      this.audio.play();
      this.isPlaying = true;
    }
  }

  addToPlaylist(track: any) {
  if (!this.playlist.find(t => t.id === track.id)) {
    this.playlist.push(track);
  }
}


  async savePlaylist(name: string) {
    await this.storage.set(name, this.playlist);
  }

  async getPlaylists() {
    const keys = await this.storage.keys();
    const playlists: { [key: string]: any } = {};
    for (let key of keys) {
      playlists[key] = await this.storage.get(key);
    }
    return playlists;
  }

  async debugStorage() {
  await this.storage.set('test_key', 'Hello Storage');
  const result = await this.storage.get('test_key');
  console.log('Storage test:', result);
}

}
