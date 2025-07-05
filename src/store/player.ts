// 文件路径: src/store/player.ts

import { defineStore } from 'pinia';
import ColorThief from 'colorthief';
import type { Playlist, Track, LyricLine } from '../types';
import { apiFetch } from '../services/api';
import { useUserStore } from './user';

export const LIKED_SONGS_PLAYLIST_ID = -1;

export enum PlayMode {
  List = 'LIST',
  Single = 'SINGLE',
  Random = 'RANDOM',
}

const colorThief = new ColorThief();

export const usePlayerStore = defineStore('player', {
  state: () => ({
    audio: null as HTMLAudioElement | null,
    currentPlaylist: null as Playlist | null,
    currentSong: null as Track | null,
    currentCoverUrl: '',
    playQueue: [] as Track[],
    currentSongIndex: -1,
    isPlaying: false,
    isLoading: false,
    playMode: PlayMode.List,
    dominantColor: 'rgb(18, 18, 18)',
    parsedLrc: [] as LyricLine[],
    currentLrcIndex: -1,
    playback: {
      currentTime: 0,
      duration: 0,
      progress: 0,
      volume: 0.5,
    },
  }),

  getters: {
    currentPlayingList(state): Track[] {
      return state.currentPlaylist?.tracks || [];
    }
  },

  actions: {
    // 核心修改：优化“下一首播放”逻辑
    addNext(tracks: Track[]) {
      if (tracks.length === 0) return;
      
      // 从待添加的曲目中，过滤掉播放队列里已存在的歌曲
      const uniqueTracks = tracks.filter(
        trackToAdd => !this.playQueue.some(itemInQueue => itemInQueue.id === trackToAdd.id)
      );

      if (uniqueTracks.length === 0) {
        alert('歌曲已在播放列表中');
        return;
      }
      
      // 将新歌插入到当前歌曲的后面
      if (this.currentSongIndex > -1) {
        this.playQueue.splice(this.currentSongIndex + 1, 0, ...uniqueTracks);
      } else {
        // 如果当前没有歌曲播放，则直接添加到队列头部
        this.playQueue.unshift(...uniqueTracks);
      }
      alert(`已添加 ${uniqueTracks.length} 首歌曲到播放列表`);
    },

    init(audioElement: HTMLAudioElement) {
      this.audio = audioElement;
      this.audio.volume = this.playback.volume;
    },

    changePlayMode() {
      switch (this.playMode) {
        case PlayMode.List: this.playMode = PlayMode.Single; break;
        case PlayMode.Single: this.playMode = PlayMode.Random; break;
        case PlayMode.Random: this.playMode = PlayMode.List; break;
      }
    },

    async loadPlaylist(playlist: Playlist) {
        this.currentPlaylist = playlist;
        this.playQueue = [...playlist.tracks];
    },

    async getPlaylistDetail(id: number) {
        // 核心修改：先清空当前歌单，再开启加载状态
        this.currentPlaylist = null;
        this.isLoading = true;
        try {
          const detailRes = await apiFetch(`/playlist/detail?id=${id}`);
          const trackRes = await apiFetch(`/playlist/track/all?id=${id}&limit=500`);
          const fullPlaylist = { ...detailRes.playlist, tracks: trackRes.songs };
          this.loadPlaylist(fullPlaylist);
        } catch (error) {
          console.error("获取歌单详情失败:", error);
        } finally {
          this.isLoading = false;
        }
      },
  
      async showLikedSongs() {
        const userStore = useUserStore();
        if (userStore.likedSongIds.length === 0) return;
        // 核心修改：先清空当前歌单，再开启加载状态
        this.currentPlaylist = null;
        this.isLoading = true;
        try {
          const songIds = userStore.likedSongIds.join(',');
          const res = await apiFetch(`/song/detail?ids=${songIds}`);
          const likedPlaylist: Playlist = {
            id: LIKED_SONGS_PLAYLIST_ID,
            name: '我喜欢的音乐',
            coverImgUrl: res.songs[0]?.al?.picUrl || '',
            description: `共 ${res.songs.length} 首歌曲`,
            tracks: res.songs,
          };
          this.loadPlaylist(likedPlaylist);
        } catch (error) {
          console.error("获取喜欢歌曲详情失败:", error);
        } finally {
          this.isLoading = false;
        }
      },
    
    async playSong(song: Track) {
      if (!this.audio) return;
      
      this.currentSongIndex = this.playQueue.findIndex(item => item.id === song.id);
      this.currentCoverUrl = song.al.picUrl;
      this.updateDominantColor(song.al.picUrl);

      this.parsedLrc = [];
      this.currentLrcIndex = -1;
      this.fetchLyrics(song.id);

      const userStore = useUserStore();
      let url = `/song/url/v1?id=${song.id}&level=exhigh`;
      if (userStore.cookie) {
        url += `&cookie=${encodeURIComponent(userStore.cookie)}`;
      }

      try {
        const res = await apiFetch(url);
        if (res.data[0].url) {
          this.currentSong = song;
          this.audio.src = res.data[0].url.replace(/^http:/, 'https:');
          this.audio.play();
          this.isPlaying = true;
        } else {
          alert(`歌曲《${song.name}》暂无版权或无法播放`);
          this.playNext();
        }
      } catch (error) {
        console.error("获取歌曲URL失败:", error);
      }
    },

    async fetchLyrics(songId: number) {
      try {
        const res = await apiFetch(`/lyric?id=${songId}`);
        if (res && res.lrc && res.lrc.lyric) {
          this.parsedLrc = this.parseLrc(res.lrc.lyric);
        }
      } catch (error) {
        console.error("获取歌词失败:", error);
        this.parsedLrc = [{ time: 0, text: '暂无歌词' }];
      }
    },

    parseLrc(lrc: string): LyricLine[] {
      const lines = lrc.split('\n');
      const result: LyricLine[] = [];
      const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

      for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
          const time = minutes * 60 + seconds + milliseconds / 1000;
          const text = line.replace(timeRegex, '').trim();
          if (text) {
            result.push({ time, text });
          }
        }
      }
      return result;
    },

    updateProgress() {
      if (!this.audio) return;
      const currentTime = this.audio.currentTime;
      this.playback.currentTime = currentTime;

      if (this.playback.duration > 0) {
        this.playback.progress = (currentTime / this.playback.duration) * 100;
      }

      if (this.parsedLrc.length > 0) {
        let newIndex = -1;
        for (let i = 0; i < this.parsedLrc.length; i++) {
          if (currentTime >= this.parsedLrc[i].time) {
            newIndex = i;
          } else {
            break;
          }
        }
        this.currentLrcIndex = newIndex;
      }
    },
    
    updateDominantColor(imageUrl: string) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = `https://images.weserv.nl/?url=${imageUrl}`;

      img.onload = () => {
        try {
          const [r, g, b] = colorThief.getColor(img);
          this.dominantColor = `rgb(${r}, ${g}, ${b})`;
        } catch (e) {
          this.dominantColor = 'rgb(18, 18, 18)';
        }
      };
      img.onerror = () => {
        this.dominantColor = 'rgb(18, 18, 18)';
      };
    },

    playNext() {
      if (this.playQueue.length === 0) return;
      switch (this.playMode) {
        case PlayMode.Single:
          if (this.currentSong) this.playSong(this.currentSong);
          break;
        case PlayMode.Random:
          const randomIndex = Math.floor(Math.random() * this.playQueue.length);
          this.playSong(this.playQueue[randomIndex]);
          break;
        case PlayMode.List:
        default:
          let nextIndex = this.currentSongIndex + 1;
          if (nextIndex >= this.playQueue.length) {
            nextIndex = 0;
          }
          this.playSong(this.playQueue[nextIndex]);
          break;
      }
    },

    playPrevious() {
      if (this.playQueue.length === 0) return;
      switch (this.playMode) {
        case PlayMode.Single:
          if (this.currentSong) this.playSong(this.currentSong);
          break;
        case PlayMode.Random:
          const randomIndex = Math.floor(Math.random() * this.playQueue.length);
          this.playSong(this.playQueue[randomIndex]);
          break;
        case PlayMode.List:
        default:
          let prevIndex = this.currentSongIndex - 1;
          if (prevIndex < 0) {
            prevIndex = this.playQueue.length - 1;
          }
          this.playSong(this.playQueue[prevIndex]);
          break;
      }
    },

    togglePlayPause() {
      if (!this.currentSong || !this.audio) return;
      this.isPlaying ? this.audio.pause() : this.audio.play();
      this.isPlaying = !this.isPlaying;
    },

    onLoadedMetadata() {
      if (!this.audio) return;
      this.playback.duration = this.audio.duration;
    },

    setAudioTime(newTime: number) {
        if (!this.audio || !this.currentSong) return;
        this.audio.currentTime = newTime;
        this.updateProgress();
    },

    setAudioVolume(newVolume: number) {
        if (!this.audio) return;
        const volume = Math.max(0, Math.min(1, newVolume));
        this.playback.volume = volume;
        this.audio.volume = volume;
    },
    
    onPlayEnded() {
      if (this.playMode === PlayMode.Single) {
        this.audio?.play();
      } else {
        this.playNext();
      }
    }
  }
});
