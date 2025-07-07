// 文件路径: src/store/player.ts

import { defineStore } from 'pinia';
import ColorThief from 'colorthief';
import type { Playlist, Track, LyricLine, ArtistDetail, Comment } from '../types';
import { apiFetch } from '../services/api';
import { useUserStore } from './user';

export const LIKED_SONGS_PLAYLIST_ID = -1;

export enum PlayMode {
  List = 'LIST',
  Single = 'SINGLE',
  Random = 'RANDOM',
}

const colorThief = new ColorThief();

// 辅助函数：将数组分割成指定大小的块
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    audio: null as HTMLAudioElement | null,
    currentView: 'playlist' as 'playlist' | 'artist',
    currentPlaylist: null as Playlist | null,
    currentArtist: null as ArtistDetail | null,
    currentRecordType: null as 'weekly' | 'allTime' | null,
    playQueue: [] as Track[],
    currentSong: null as Track | null,
    currentSongIndex: -1,
    currentCoverUrl: '',
    isPlaying: false,
    isLoading: false,
    playMode: PlayMode.List,
    dominantColor: 'rgb(18, 18, 18)',
    parsedLrc: [] as LyricLine[],
    currentLrcIndex: -1,
    songUrlCache: new Map<number, string>(),
    isDetailPageVisible: false,
    detailPageView: 'cover' as 'cover' | 'lyrics', // 新增：详情页视图
    audioQuality: 'exhigh' as 'standard' | 'higher' | 'exhigh' | 'lossless',
    currentSongComments: {
        hotComments: [] as Comment[],
        comments: [] as Comment[],
        total: 0,
        cursor: '' as string | null, // 用于分页
        hasMore: true,
      },
      commentSortType: 1 as 1 | 2 | 3, // 1:推荐, 2:最热, 3:最新
    isCommentLoading: false,
    playback: {
      currentTime: 0,
      duration: 0,
      progress: 0,
      volume: 0.5,
    },
  }),

  actions: {
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

    async playSong(song: Track) {
      if (!this.audio) return;

      if (this.playQueue.length === 0 && this.currentPlaylist) {
        this.playQueue = [...this.currentPlaylist.tracks];
      }

      const existingIndexInQueue = this.playQueue.findIndex(item => item.id === song.id);

      if (existingIndexInQueue !== -1) {
        this.currentSongIndex = existingIndexInQueue;
      } else {
        if (this.currentSongIndex > -1) {
          this.playQueue.splice(this.currentSongIndex + 1, 0, song);
          this.currentSongIndex += 1;
        } else {
          this.playQueue.unshift(song);
          this.currentSongIndex = 0;
        }
      }

      const songToPlay = this.playQueue[this.currentSongIndex];
      this.currentSong = songToPlay;
      this.currentCoverUrl = songToPlay.al.picUrl;
      this.updateDominantColor(songToPlay.al.picUrl);

      this.parsedLrc = [];
      this.currentLrcIndex = -1;
      this.fetchLyrics(songToPlay.id);

      if (this.songUrlCache.has(songToPlay.id)) {
        this.audio.src = this.songUrlCache.get(songToPlay.id)!;
        this.audio.play();
        this.isPlaying = true;
        return;
      }

      const userStore = useUserStore();
      let url = `/song/url/v1?id=${songToPlay.id}&level=${this.audioQuality}`;
      if (userStore.cookie) {
        url += `&cookie=${encodeURIComponent(userStore.cookie)}`;
      }

      try {
        const res = await apiFetch(url);
        if (res.data[0].url) {
          const songUrl = res.data[0].url.replace(/^http:/, 'https:');
          
          this.songUrlCache.set(songToPlay.id, songUrl);
          if (this.songUrlCache.size > 100) {
            const firstKey = this.songUrlCache.keys().next().value;
            if (firstKey !== undefined) {
              this.songUrlCache.delete(firstKey);
            }
          }

          this.audio.src = songUrl;
          this.audio.play();
          this.isPlaying = true;
        } else {
          alert(`歌曲《${songToPlay.name}》暂无版权或无法播放`);
          this.playNext();
        }
      } catch (error) {
        console.error("获取歌曲URL失败:", error);
      }
    },

    addNext(tracks: Track[]) {
      if (tracks.length === 0) return;

      if (this.playQueue.length === 0) {
          this.playQueue = [...tracks];
          this.playSong(this.playQueue[0]);
          return;
      }
      
      const uniqueTracks = tracks.filter(
        trackToAdd => !this.playQueue.some(itemInQueue => itemInQueue.id === trackToAdd.id)
      );

      if (uniqueTracks.length === 0) {
        alert('歌曲已在播放列表中');
        return;
      }
      
      if (this.currentSongIndex > -1) {
        this.playQueue.splice(this.currentSongIndex + 1, 0, ...uniqueTracks);
      } else {
        this.playQueue.unshift(...uniqueTracks);
      }
      alert(`已添加 ${uniqueTracks.length} 首歌曲到播放列表`);
    },

    reorderQueue(newQueue: Track[]) {
      this.playQueue = newQueue;
      if (this.currentSong) {
        this.currentSongIndex = this.playQueue.findIndex(track => track.id === this.currentSong!.id);
      }
    },

    async getPlaylistDetail(id: number) {
      this.isLoading = true;
      this.currentPlaylist = null;
      this.currentArtist = null;
      this.currentRecordType = null;
      this.currentView = 'playlist';
      try {
        const detailRes = await apiFetch(`/playlist/detail?id=${id}`);
        const playlistInfo = detailRes.playlist;
        const trackIds = playlistInfo.trackIds.map((item: { id: number }) => item.id);

        const idChunks = chunkArray(trackIds, 200);
        let allTracks: Track[] = [];

        const trackRequests = idChunks.map(chunk => 
          apiFetch(`/song/detail?ids=${chunk.join(',')}`)
        );
        const trackResponses = await Promise.all(trackRequests);

        for (const res of trackResponses) {
          allTracks = allTracks.concat(res.songs);
        }

        this.currentPlaylist = {
          id: playlistInfo.id,
          name: playlistInfo.name,
          coverImgUrl: playlistInfo.coverImgUrl,
          description: playlistInfo.description,
          tracks: allTracks,
        };

      } catch (error) {
        console.error("获取歌单详情失败:", error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async showArtistPage(artistId: number) {
      this.currentView = 'artist';
      this.isLoading = true;
      this.currentArtist = null;

      try {
        const [detailRes, topSongsRes, albumsRes] = await Promise.all([
          apiFetch(`/artist/detail?id=${artistId}`),
          apiFetch(`/artist/top/song?id=${artistId}`),
          apiFetch(`/artist/album?id=${artistId}&limit=50`)
        ]);

        this.currentArtist = {
          id: detailRes.data.artist.id,
          name: detailRes.data.artist.name,
          cover: detailRes.data.artist.cover,
          briefDesc: detailRes.data.artist.briefDesc,
          topSongs: topSongsRes.songs,
          albums: albumsRes.hotAlbums,
        };

      } catch (error) {
        console.error("获取歌手详情失败:", error);
        this.currentView = 'playlist';
      } finally {
        this.isLoading = false;
      }
    },

    async showAlbumAsPlaylist(albumId: number) {
        this.isLoading = true;
        this.currentPlaylist = null;
        try {
            const res = await apiFetch(`/album?id=${albumId}`);
            const mainAlbum = res.album;
            
            const tracksWithCorrectAlbum = res.songs.map((song: Track) => {
              return {
                ...song,
                al: {
                  id: mainAlbum.id,
                  name: mainAlbum.name,
                  picUrl: mainAlbum.picUrl,
                }
              };
            });

            const albumPlaylist: Playlist = {
                id: mainAlbum.id,
                name: mainAlbum.name,
                coverImgUrl: mainAlbum.picUrl,
                description: mainAlbum.description,
                tracks: tracksWithCorrectAlbum,
            };

            this.currentPlaylist = albumPlaylist;
            this.currentView = 'playlist';
        } catch (error) {
            console.error("获取专辑详情失败:", error);
        } finally {
            this.isLoading = false;
        }
    },
    
    goBackToArtistView() {
      if (this.currentArtist) {
        this.currentView = 'artist';
        this.currentPlaylist = null;
      }
    },
    
    async showUserRecord(type: 'weekly' | 'allTime') {
      const userStore = useUserStore();
      if (!userStore.profile || !userStore.cookie) {
        alert("请先登录");
        return;
      }

      this.isLoading = true;
      this.currentPlaylist = null;
      this.currentView = 'playlist';
      this.currentRecordType = type;

      try {
        const apiType = type === 'weekly' ? 1 : 0;
        const endpoint = `/user/record?uid=${userStore.profile.userId}&type=${apiType}&cookie=${encodeURIComponent(userStore.cookie)}`;
        const res = await apiFetch(endpoint);
        
        const recordData = type === 'weekly' ? res.weekData : res.allData;
        if (!recordData) throw new Error('No record data found');

        const tracks = recordData.map((item: any) => item.song);
        
        const recordPlaylist: Playlist = {
          id: type === 'weekly' ? -2 : -3,
          name: `听歌排行`,
          coverImgUrl: tracks[0]?.al?.picUrl || '',
          description: `根据您${type === 'weekly' ? '最近一周' : '所有时间'}的听歌记录生成`,
          tracks: tracks,
        };

        this.currentPlaylist = recordPlaylist;

      } catch (error) {
        console.error("获取听歌排行失败:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchLyrics(songId: number) {
      try {
        const res = await apiFetch(`/lyric?id=${songId}`);
        if (res && res.lrc && res.lrc.lyric) {
          this.parsedLrc = this.parseLrc(res.lrc.lyric);
        }
      } catch (error) {
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
          const time = parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + parseInt(match[3].padEnd(3, '0'), 10) / 1000;
          const text = line.replace(timeRegex, '').trim();
          if (text) result.push({ time, text });
        }
      }
      return result;
    },

    updateProgress() {
      if (!this.audio) return;
      const currentTime = this.audio.currentTime;
      this.playback.currentTime = currentTime;
      if (this.playback.duration > 0) this.playback.progress = (currentTime / this.playback.duration) * 100;
      if (this.parsedLrc.length > 0) {
        let newIndex = -1;
        for (let i = 0; i < this.parsedLrc.length; i++) {
          if (currentTime >= this.parsedLrc[i].time) newIndex = i;
          else break;
        }
        this.currentLrcIndex = newIndex;
      }
    },
    
    updateDominantColor(imageUrl: string) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = `https://images.weserv.nl/?url=${imageUrl}`;
      img.onload = () => {
        try { this.dominantColor = `rgb(${colorThief.getColor(img).join(',')})`; } 
        catch (e) { this.dominantColor = 'rgb(18, 18, 18)'; }
      };
      img.onerror = () => { this.dominantColor = 'rgb(18, 18, 18)'; };
    },

    playNext() {
      if (this.playQueue.length === 0) return;
      switch (this.playMode) {
        case PlayMode.Single: if (this.currentSong) this.playSong(this.currentSong); break;
        case PlayMode.Random: this.playSong(this.playQueue[Math.floor(Math.random() * this.playQueue.length)]); break;
        case PlayMode.List: default:
          let nextIndex = this.currentSongIndex + 1;
          if (nextIndex >= this.playQueue.length) nextIndex = 0;
          this.playSong(this.playQueue[nextIndex]);
          break;
      }
    },

    playPrevious() {
      if (this.playQueue.length === 0) return;
      switch (this.playMode) {
        case PlayMode.Single: if (this.currentSong) this.playSong(this.currentSong); break;
        case PlayMode.Random: this.playSong(this.playQueue[Math.floor(Math.random() * this.playQueue.length)]); break;
        case PlayMode.List: default:
          let prevIndex = this.currentSongIndex - 1;
          if (prevIndex < 0) prevIndex = this.playQueue.length - 1;
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
      if (this.audio) this.playback.duration = this.audio.duration;
    },

    setAudioTime(newTime: number) {
      if (this.audio && this.currentSong) {
        this.audio.currentTime = newTime;
        this.updateProgress();
      }
    },

    setAudioVolume(newVolume: number) {
      if (this.audio) {
        this.audio.volume = Math.max(0, Math.min(1, newVolume));
        this.playback.volume = this.audio.volume;
      }
    },
    
    onPlayEnded() {
      if (this.playMode === PlayMode.Single) this.audio?.play();
      else this.playNext();
    },

    toggleDetailPage(visible: boolean) {
      this.isDetailPageVisible = visible;
      if (visible && this.currentSong) {
        this.fetchComments(true);
      }
    },

    toggleDetailView() {
        this.detailPageView = this.detailPageView === 'cover' ? 'lyrics' : 'cover';
      },
      async setAudioQuality(quality: 'standard' | 'higher' | 'exhigh' | 'lossless') {
        this.audioQuality = quality;
        if (this.currentSong) {
          await this.playSong(this.currentSong);
        }
      },

      async setCommentSortType(sortType: 1 | 2 | 3) {
        this.commentSortType = sortType;
        // 切换排序时，强制刷新评论
        await this.fetchComments(true);
      },
  
  // 核心修改：获取评论，支持分页和排序
  async fetchComments(isInitial = false) {
    if (!this.currentSong || this.isCommentLoading) return;
    if (isInitial) {
      this.currentSongComments.comments = [];
      this.currentSongComments.hotComments = [];
      this.currentSongComments.cursor = null;
      this.currentSongComments.hasMore = true;
    }
    if (!this.currentSongComments.hasMore) return;

    this.isCommentLoading = true;
    try {
      const songId = this.currentSong.id;
      let endpoint = `/comment/new?type=0&id=${songId}&sortType=${this.commentSortType}&pageSize=20`;
      if (this.currentSongComments.cursor) {
        endpoint += `&cursor=${this.currentSongComments.cursor}`;
      }
      
      const res = await apiFetch(endpoint);
      const data = res.data;

      if (isInitial && data.hotComments) {
        this.currentSongComments.hotComments = data.hotComments;
      }
      this.currentSongComments.comments.push(...data.comments);
      this.currentSongComments.total = data.totalCount;
      this.currentSongComments.hasMore = data.hasMore;
      this.currentSongComments.cursor = data.cursor;

    } catch (error) {
      console.error("获取评论失败:", error);
    } finally {
      this.isCommentLoading = false;
    }
  },
  async replyToComment(commentId: number, content: string) {
    const userStore = useUserStore();
    if (!userStore.cookie) { alert("请先登录"); return false; }
    
    const endpoint = `/comment?t=2&type=0&id=${this.currentSong!.id}&content=${encodeURIComponent(content)}&commentId=${commentId}&cookie=${encodeURIComponent(userStore.cookie)}`;
    
    try {
      const res = await apiFetch(endpoint);
      if (res.code === 200) {
        alert('回复成功！');
        // 可以在这里刷新评论区或进行乐观更新
        return true;
      } else {
        throw new Error(res.message || '回复失败');
      }
    } catch (error) {
      console.error("回复评论失败:", error);
      alert('回复失败，请稍后再试');
      return false;
    }
  },

    async likeComment(commentId: number, liked: boolean) {
      const userStore = useUserStore();
      if (!userStore.cookie) { alert("请先登录"); return; }
      const t = liked ? 1 : 0;
      const type = 0;
      try {
        const endpoint = `/comment/like?id=${this.currentSong!.id}&cid=${commentId}&t=${t}&type=${type}&cookie=${encodeURIComponent(userStore.cookie)}`;
        const res = await apiFetch(endpoint);
        if (res.code === 200) {
          const updateComment = (list: Comment[]) => {
            const comment = list.find(c => c.commentId === commentId);
            if (comment) {
              comment.liked = liked;
              comment.likedCount += liked ? 1 : -1;
            }
          };
          updateComment(this.currentSongComments.hotComments);
          updateComment(this.currentSongComments.comments);
        }
      } catch (error) {
        console.error("点赞评论失败:", error);
      }
    }
  }
});
