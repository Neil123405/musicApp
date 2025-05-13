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

  playTrack(track: any) {
  this.musicService.play(track);
  this.navCtrl.navigateForward('/player'); // 👈 go to player page
}

}
