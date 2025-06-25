<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-black text-gray-300 font-sans">
    
    <!-- 主要内容区域 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏 -->
      <aside class="w-64 bg-[#121212] flex-shrink-0 flex flex-col p-2">
        <!-- 登录区域 -->
        <div class="bg-[#181818] rounded-lg p-4 mb-2">
          <div v-if="!user.profile" class="flex flex-col items-center">
            <h2 class="text-lg font-bold mb-2">登录网易云</h2>
            <p class="text-xs text-gray-400 mb-4 text-center">扫描二维码登录，同步您的音乐数据</p>
            <div v-if="qr.img" class="relative w-40 h-40 bg-white p-2 rounded-lg flex items-center justify-center">
              <img :src="qr.img" alt="QR Code">
              <div v-if="qr.status === 800" @click="loginWithQRCode" class="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white cursor-pointer rounded-lg">
                <p>二维码已失效</p>
                <p class="text-xs">点击刷新</p>
              </div>
              <div v-if="qr.status === 802" class="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white rounded-lg">
                <div class="loader mb-2"></div>
                <p>请在手机上确认</p>
              </div>
            </div>
             <button v-else @click="loginWithQRCode" class="mt-4 px-4 py-2 bg-[#c0392b] text-white rounded-full hover:bg-red-700 transition-colors">
              {{ isLoading.qr ? '生成中...' : '点击生成二维码' }}
            </button>
          </div>
          <div v-else class="flex items-center">
            <img :src="user.profile.avatarUrl" class="w-12 h-12 rounded-full mr-4">
            <div>
              <p class="font-bold">{{ user.profile.nickname }}</p>
              <p class="text-xs text-gray-400">Lv.{{ user.level }}</p>
            </div>
          </div>
        </div>

        <!-- 歌单列表 -->
        <div class="bg-[#181818] rounded-lg flex-1 overflow-y-auto">
             <h2 class="text-lg font-bold p-4 pb-2">我的歌单</h2>
             <ul v-if="user.profile && !isLoading.playlists">
                 <li v-for="playlist in playlists" :key="playlist.id"
                     @click="getPlaylistDetail(playlist.id)"
                     class="px-4 py-2 hover:bg-[#282828] cursor-pointer rounded-md mx-2"
                     :class="{ 'bg-[#c0392b] text-white': currentPlaylist && currentPlaylist.id === playlist.id }">
                     {{ playlist.name }}
                 </li>
             </ul>
             <div v-if="isLoading.playlists" class="p-4 text-center">
                 <div class="loader mx-auto"></div>
             </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="flex-1 bg-gradient-to-b from-[#222] to-[#121212] overflow-y-auto">
        <div v-if="currentPlaylist && !isLoading.songs" class="p-6">
          <!-- 歌单头部信息 -->
          <div class="flex items-end mb-8">
            <img :src="currentPlaylist.coverImgUrl" class="w-48 h-48 rounded-lg shadow-lg mr-6">
            <div>
              <p class="text-sm">歌单</p>
              <h1 class="text-5xl font-extrabold mb-4">{{ currentPlaylist.name }}</h1>
              <p class="text-gray-400 text-sm">{{ currentPlaylist.description?.substring(0, 100) }}...</p>
            </div>
          </div>
          <!-- 歌曲列表 -->
          <table class="w-full text-left">
            <thead class="text-gray-400 border-b border-gray-700">
              <tr>
                <th class="p-2 w-8">#</th>
                <th class="p-2">标题</th>
                <th class="p-2">专辑</th>
                <th class="p-2">时长</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(track, index) in currentPlaylist.tracks" :key="track.id"
                  @dblclick="playSong(track)"
                  class="hover:bg-[#282828] rounded-lg cursor-pointer"
                  :class="{'text-green-400': currentSong && currentSong.id === track.id}">
                <td class="p-3">{{ index + 1 }}</td>
                <td class="p-3 flex items-center">
                  <img :src="track.al.picUrl" class="w-10 h-10 rounded mr-4">
                  <div>
                    <p class="font-semibold">{{ track.name }}</p>
                    <p class="text-xs text-gray-400">{{ track.ar.map(a => a.name).join(' / ') }}</p>
                  </div>
                </td>
                <td class="p-3">{{ track.al.name }}</td>
                <td class="p-3">{{ formatDuration(track.dt / 1000) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="isLoading.songs" class="flex items-center justify-center h-full">
          <div class="loader"></div>
        </div>
         <div v-if="!currentPlaylist && !isLoading.songs" class="flex flex-col items-center justify-center h-full text-gray-500">
            <Music class="w-24 h-24 mb-4"/>
            <p class="text-xl">请先登录并选择一个歌单</p>
        </div>
      </main>
    </div>

    <!-- 底部播放器控制条 -->
    <footer class="h-24 bg-[#181818] border-t border-gray-800 flex-shrink-0 flex items-center justify-between px-4">
         <!-- 左侧歌曲信息 -->
        <div class="flex items-center w-1/4">
          <div v-if="currentSong">
            <img :src="currentSong.al.picUrl" class="w-16 h-16 rounded-md mr-4">
          </div>
          <div v-if="currentSong">
            <p class="font-bold">{{ currentSong.name }}</p>
            <p class="text-xs text-gray-400">{{ currentSong.ar.map(a => a.name).join(' / ') }}</p>
          </div>
           <div v-else class="text-gray-500">
            未选择歌曲
          </div>
        </div>

        <!-- 中间播放控制 -->
        <div class="flex flex-col items-center justify-center w-1/2">
          <div class="flex items-center space-x-6">
            <Shuffle class="cursor-pointer hover:text-white"/>
            <SkipBack class="cursor-pointer hover:text-white"/>
            <div @click="togglePlayPause" class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <Pause v-if="isPlaying" class="w-6 h-6"/>
              <Play v-else class="w-6 h-6"/>
            </div>
            <SkipForward class="cursor-pointer hover:text-white"/>
            <Repeat class="cursor-pointer hover:text-white"/>
          </div>
          <div class="flex items-center w-full mt-2 space-x-2 text-xs">
            <span>{{ formatDuration(playback.currentTime) }}</span>
            <div class="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group" @click="seek">
              <div class="h-1 bg-white rounded-full relative" :style="{ width: playback.progress + '%' }">
                 <div class="absolute right-0 top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            <span>{{ formatDuration(playback.duration) }}</span>
          </div>
        </div>
        
         <!-- 右侧音量控制 -->
        <div class="flex items-center justify-end w-1/4 space-x-2">
             <Volume2/>
             <div class="w-24 h-1 bg-gray-600 rounded-full cursor-pointer group" @click="setVolume">
              <div class="h-1 bg-white rounded-full relative" :style="{ width: playback.volume * 100 + '%' }">
                   <div class="absolute right-0 top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
             </div>
        </div>
    </footer>
    
    <!-- 全局Audio元素 -->
    <audio ref="audioPlayer" @timeupdate="updateProgress" @loadedmetadata="onLoadedMetadata" @ended="isPlaying = false"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Music, Play, Pause, Shuffle, SkipBack, SkipForward, Repeat, Volume2 } from 'lucide-vue-next';

// --- 类型定义 (建议后续移动到独立的 types/index.ts 文件) ---
interface UserProfile {
  userId: number;
  nickname: string;
  avatarUrl: string;
}
interface Artist {
  name: string;
}
interface Album {
  name: string;
  picUrl: string;
}
interface Track {
  id: number;
  name: string;
  ar: Artist[];
  al: Album;
  dt: number; // duration
}
interface Playlist {
  id: number;
  name: string;
  coverImgUrl: string;
  description: string | null;
  tracks: Track[];
}

// --- 响应式状态 (建议后续使用 Pinia 进行管理) ---
const apiBaseUrl = 'http://localhost:3000'; // !!重要!! 请将此地址修改为您本地NeteaseCloudMusicApi服务的地址

const user = reactive<{ profile: UserProfile | null; level: number; cookie: string | null }>({
  profile: null,
  level: 0,
  cookie: null,
});

const qr = reactive({
  key: '',
  img: '',
  status: 0, // 800:过期, 801:待扫码, 802:待确认, 803:成功
  checkInterval: null as number | null,
});

const playlists = ref<Playlist[]>([]);
const currentPlaylist = ref<Playlist | null>(null);
const currentSong = ref<Track | null>(null);
const isPlaying = ref(false);

const isLoading = reactive({
  qr: false,
  playlists: false,
  songs: false,
});

const playback = reactive({
  currentTime: 0,
  duration: 0,
  progress: 0,
  volume: 0.5,
});

// DOM引用
const audioPlayer = ref<HTMLAudioElement | null>(null);


// --- 方法 (建议后续将API请求封装到 services/api.ts) ---

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${apiBaseUrl}${endpoint}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const loginWithQRCode = async () => {
  isLoading.qr = true;
  try {
    // 1. 获取Key
    const keyRes = await apiFetch(`/login/qr/key?timestamp=${Date.now()}`);
    qr.key = keyRes.data.unikey;

    // 2. 创建二维码
    const createRes = await apiFetch(`/login/qr/create?key=${qr.key}&qrimg=true&timestamp=${Date.now()}`);
    qr.img = createRes.data.qrimg;
    qr.status = 801;

    // 3. 轮询
    checkQRStatus();
  } catch (error) {
    console.error("二维码登录失败:", error);
  } finally {
    isLoading.qr = false;
  }
};

const checkQRStatus = () => {
  if (qr.checkInterval) clearInterval(qr.checkInterval);
  
  qr.checkInterval = window.setInterval(async () => {
    if (!qr.key) return;
    try {
      // 检查二维码状态的接口返回的cookie需要在浏览器环境下通过CORS和withCredentials处理
      // 在Electron中，应该通过主进程发起请求来绕过此限制
      const res = await apiFetch(`/login/qr/check?key=${qr.key}&timestamp=${Date.now()}`);
      qr.status = res.code;
      if (res.code === 803) { // 登录成功
        if (qr.checkInterval) clearInterval(qr.checkInterval);
        user.cookie = res.cookie;
        await getLoginStatus(res.cookie);
      }
      if (res.code === 800) { // 二维码过期
        if (qr.checkInterval) clearInterval(qr.checkInterval);
      }
    } catch (error) {
      console.error("检查二维码状态失败:", error);
      if (qr.checkInterval) clearInterval(qr.checkInterval);
    }
  }, 3000);
};

const getLoginStatus = async (cookie: string) => {
  console.log('正在获取用户状态...');
  try {
    const statusRes = await apiFetch(`/login/status?timestamp=${Date.now()}&cookie=${encodeURIComponent(cookie)}`);
    if (statusRes.data.code === 200 && statusRes.data.profile) {
       user.profile = statusRes.data.profile;
       await getUserAccountInfo();
       if(user.profile) {
         await getUserPlaylists(user.profile.userId);
       }
    } else {
        console.error('获取用户状态失败', statusRes);
    }
  } catch(e) {
      console.error('获取登录状态的请求失败，请检查API服务CORS设置及是否正确传递Cookie。', e);
      alert('获取登录状态失败！请检查API服务CORS设置。在浏览器环境，这通常是预料中的问题。在Electron中，应通过主进程发起网络请求。');
  }
};

const getUserAccountInfo = async () => {
  if(!user.cookie) return;
  const levelRes = await apiFetch(`/user/level?cookie=${encodeURIComponent(user.cookie)}`);
  user.level = levelRes.data.level;
};

const getUserPlaylists = async (uid: number) => {
  if(!user.cookie) return;
  isLoading.playlists = true;
  try {
    const res = await apiFetch(`/user/playlist?uid=${uid}&cookie=${encodeURIComponent(user.cookie)}`);
    playlists.value = res.playlist;
  } catch (error) {
    console.error("获取用户歌单失败:", error);
  } finally {
    isLoading.playlists = false;
  }
};

const getPlaylistDetail = async (id: number) => {
  isLoading.songs = true;
  currentPlaylist.value = null;
  try {
    const res = await apiFetch(`/playlist/track/all?id=${id}&limit=100`); // 获取歌单所有歌曲，这里限制前100首
    // playlist/detail 接口获取的歌曲列表不完整，换用 /playlist/track/all
    const detailRes = await apiFetch(`/playlist/detail?id=${id}`);
    
    currentPlaylist.value = {
        ...detailRes.playlist,
        tracks: res.songs
    };

  } catch (error) {
    console.error("获取歌单详情失败:", error);
  } finally {
    isLoading.songs = false;
  }
};

const playSong = async (song: Track) => {
  try {
    const res = await apiFetch(`/song/url/v1?id=${song.id}&level=exhigh`);
    if (res.data[0].url && audioPlayer.value) {
      currentSong.value = song;
      audioPlayer.value.src = res.data[0].url;
      audioPlayer.value.play();
      isPlaying.value = true;
    } else {
      alert(`歌曲《${song.name}》暂无版权或无法播放`);
    }
  } catch (error) {
    console.error("获取歌曲URL失败:", error);
  }
};

const togglePlayPause = () => {
  if (!currentSong.value || !audioPlayer.value) return;
  if (isPlaying.value) {
    audioPlayer.value.pause();
  } else {
    audioPlayer.value.play();
  }
  isPlaying.value = !isPlaying.value;
};

const updateProgress = () => {
  if (!audioPlayer.value) return;
  playback.currentTime = audioPlayer.value.currentTime;
  if (playback.duration > 0) {
    playback.progress = (playback.currentTime / playback.duration) * 100;
  }
};

const onLoadedMetadata = () => {
  if (!audioPlayer.value) return;
  playback.duration = audioPlayer.value.duration;
};

const seek = (event: MouseEvent) => {
  if (!currentSong.value || !audioPlayer.value) return;
  const timeline = event.currentTarget as HTMLElement;
  const clickX = event.clientX - timeline.getBoundingClientRect().left;
  const newProgress = clickX / timeline.offsetWidth;
  audioPlayer.value.currentTime = newProgress * playback.duration;
};

const setVolume = (event: MouseEvent) => {
    if (!audioPlayer.value) return;
    const volumeBar = event.currentTarget as HTMLElement;
    const clickX = event.clientX - volumeBar.getBoundingClientRect().left;
    const newVolume = Math.max(0, Math.min(1, clickX / volumeBar.offsetWidth));
    playback.volume = newVolume;
    audioPlayer.value.volume = newVolume;
};


// --- 生命周期钩子 ---
onMounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = playback.volume;
  }
});

watch(() => user.cookie, (newCookie) => {
  if (newCookie) {
    // 在真实应用中，当cookie变化时保存到electron-store或localStorage
    console.log("Cookie已更新，准备持久化存储。");
  }
});
</script>

<style>
/* 自定义滚动条样式，使其更美观 */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #191919;
}
::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
/* 简单的加载动画 */
.loader {
  border: 4px solid #f3f3f3;
  border-radius: 50%;
  border-top: 4px solid #c0392b;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
