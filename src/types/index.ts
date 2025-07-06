// 文件路径: src/types/index.ts

export interface UserProfile {
    userId: number;
    nickname: string;
    avatarUrl: string;
  }
  
  export interface Artist {
    id: number;
    name: string;
  }
  
  export interface Album {
    id: number;
    name: string;
    picUrl: string;
  }
  
  export interface Track {
    id: number;
    name: string;
    ar: Artist[];
    al: Album;
    dt: number; // duration in ms
  }
  
  export interface Playlist {
    id: number;
    name: string;
    coverImgUrl: string;
    description: string | null;
    tracks: Track[];
  }
  
  export interface LyricLine {
    time: number;
    text: string;
  }
  
  // 歌手详情的数据结构
  export interface ArtistDetail extends Artist {
    cover: string;
    briefDesc: string;
    topSongs: Track[];
    albums: any[]; // API返回的专辑类型比较复杂，这里用any简化
  }
  