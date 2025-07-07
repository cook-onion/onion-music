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
  // 新增：被回复的评论信息
export interface BeReplied {
    user: {
      userId: number;
      nickname: string;
    };
    content: string;
  }
  // 新增：评论的数据结构
export interface Comment {
    user: {
      userId: number;
      nickname: string;
      avatarUrl: string;
    };
    commentId: number;
    content: string;
    time: number;
    likedCount: number;
    liked: boolean;
    beReplied?: BeReplied[]; // 可选的被回复数组
  }