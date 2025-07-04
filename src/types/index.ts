

export interface UserProfile{
  userId: number,
  nickname: string,
  avatarUrl: string,
  
}
export interface Artist {
    name: string,
}
export interface Album {
    name: string,
    picUrl: string,
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

  // 新增：歌词行的数据结构
export interface LyricLine {
    time: number;
    text: string;
  }