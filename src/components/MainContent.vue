<!-- 
  文件路径: src/components/MainContent.vue
  描述: 修复了类型安全问题，防止因 currentPlaylist 为 null 导致的构建失败。
-->
<template>
    <main 
      class="flex-1 overflow-y-auto bg-gradient-to-b from-[#222] to-[#121212] relative"
      @click="contextMenu.show = false"
    >
      <!-- 骨架屏加载状态 -->
      <div v-if="playerStore.isLoading" class="p-6 animate-pulse">
        <div class="flex items-end mb-8">
          <div class="w-48 h-48 bg-gray-700/50 rounded-lg mr-6 flex-shrink-0"></div>
          <div class="flex-1">
            <div class="h-6 w-24 bg-gray-700/50 rounded mb-4"></div>
            <div class="h-12 w-3/4 bg-gray-700/50 rounded mb-4"></div>
            <div class="h-4 w-1/2 bg-gray-700/50 rounded"></div>
          </div>
        </div>
        <div class="w-full mt-12">
          <div v-for="n in 8" :key="n" class="flex items-center p-3 h-[56px] border-b border-white/5">
            <div class="w-5 h-5 bg-gray-700/50 rounded-sm mr-6"></div>
            <div class="w-10 h-10 bg-gray-700/50 rounded mr-4"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/5 bg-gray-700/50 rounded"></div>
              <div class="h-3 w-2/5 bg-gray-700/50 rounded"></div>
            </div>
            <div class="w-1/4 h-4 bg-gray-700/50 rounded ml-4"></div>
            <div class="w-1/6 h-4 bg-gray-700/50 rounded ml-4"></div>
          </div>
        </div>
      </div>
  
      <!-- 歌手主页视图 -->
      <div v-else-if="playerStore.currentView === 'artist' && playerStore.currentArtist" class="p-6">
        <div class="relative h-80 rounded-lg overflow-hidden mb-8 -mx-6 -mt-6">
          <img :src="playerStore.currentArtist.cover" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <h1 class="absolute bottom-6 left-6 text-6xl font-extrabold">{{ playerStore.currentArtist.name }}</h1>
        </div>
        
        <div>
          <h2 class="text-2xl font-bold mb-4">热门歌曲</h2>
          <ul>
            <li v-for="(track, index) in playerStore.currentArtist.topSongs.slice(0, 5)" :key="track.id"
                @dblclick="playerStore.playSong(track)"
                class="flex items-center p-2 rounded-md hover:bg-white/10 cursor-pointer group">
              <span class="w-8 text-center text-gray-400">{{ index + 1 }}</span>
              <img :src="track.al.picUrl" class="w-10 h-10 rounded mr-4">
              <p class="font-semibold flex-1">{{ track.name }}</p>
              <button @click.stop="userStore.likeSong(track.id, !isLiked(track.id))" class="opacity-0 group-hover:opacity-100 transition-opacity mr-4">
                <Heart :fill="isLiked(track.id) ? 'currentColor' : 'none'" class="w-5 h-5" :class="isLiked(track.id) ? 'text-red-500' : 'text-gray-400'" />
              </button>
              <span class="text-sm text-gray-400">{{ formatDuration(track.dt / 1000) }}</span>
            </li>
          </ul>
        </div>
  
        <div class="mt-12">
          <h2 class="text-2xl font-bold mb-4">专辑</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div v-for="album in playerStore.currentArtist.albums" :key="album.id" 
                 @click="playerStore.showAlbumAsPlaylist(album.id)"
                 class="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <img :src="album.picUrl" class="w-full aspect-square rounded-md mb-2 shadow-lg">
              <p class="font-semibold truncate">{{ album.name }}</p>
              <p class="text-sm text-gray-400">{{ new Date(album.publishTime).getFullYear() }}</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 歌单/排行榜详情视图 -->
      <div v-else-if="playerStore.currentPlaylist" class="p-6">
        <div class="flex items-end mb-8">
          <button 
            v-if="playerStore.currentArtist" 
            @click="playerStore.goBackToArtistView()" 
            class="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            title="返回歌手页面"
          >
            <ArrowLeft class="w-6 h-6" />
          </button>
          <img :src="playerStore.currentPlaylist.coverImgUrl" class="w-48 h-48 rounded-lg shadow-lg mr-6 flex-shrink-0">
          <div class="overflow-hidden flex-1">
            <p class="text-sm">{{ playerStore.currentRecordType ? '排行榜' : '歌单' }}</p>
            <h1 class="text-5xl font-extrabold mb-4 truncate">{{ playerStore.currentPlaylist.name }}</h1>
            <p class="text-gray-200 text-sm truncate">{{ playerStore.currentPlaylist.description }}</p>
          </div>
        </div>
        
        <div class="flex items-center justify-between mb-4">
          <div v-if="playerStore.currentRecordType" class="inline-flex bg-white/10 rounded-full p-1 space-x-1">
            <button 
              @click="playerStore.showUserRecord('weekly')"
              class="px-4 py-1 rounded-full text-sm transition-colors"
              :class="playerStore.currentRecordType === 'weekly' ? 'bg-white text-black font-bold' : 'text-gray-300 hover:bg-white/5'"
            >
              最近一周
            </button>
            <button 
              @click="playerStore.showUserRecord('allTime')"
              class="px-4 py-1 rounded-full text-sm transition-colors"
              :class="playerStore.currentRecordType === 'allTime' ? 'bg-white text-black font-bold' : 'text-gray-300 hover:bg-white/5'"
            >
              所有时间
            </button>
          </div>
          <button @click="toggleMultiSelectMode" class="p-2 rounded-full hover:bg-white/10 transition-colors ml-auto" title="多选">
            <ListChecks class="w-6 h-6" :class="isMultiSelectMode ? 'text-blue-400' : 'text-gray-400'" />
          </button>
        </div>
        
        <div v-if="isMultiSelectMode && selectedTrackIds.length > 0" class="sticky top-0 bg-[#121212]/80 backdrop-blur-sm p-4 z-10 flex items-center justify-between mb-4 rounded-lg">
          <span class="text-sm font-bold">已选择 {{ selectedTrackIds.length }} 首</span>
          <div class="flex items-center space-x-4">
            <button @click="handlePlayNext" class="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors text-sm">
              <Play class="w-4 h-4" />
              <span>下一首播放</span>
            </button>
            <button @click="handleLikeSelected" class="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-sm">
              <Heart class="w-4 h-4" />
              <span>收藏</span>
            </button>
          </div>
        </div>
  
        <table class="w-full text-left table-fixed">
          <thead class="text-gray-300 border-b border-white/10 text-sm">
            <tr>
              <th class="p-3 w-16 text-center font-normal">
                <label v-if="isMultiSelectMode" class="relative flex items-center justify-center cursor-pointer">
                  <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" class="sr-only peer">
                  <div class="w-5 h-5 bg-transparent border-2 border-gray-500 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                  <Check class="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
                </label>
                <span v-else>#</span>
              </th>
              <th class="p-3 font-normal">标题</th>
              <th class="p-3 font-normal">歌手</th>
              <th class="p-3 font-normal">专辑</th>
              <th class="p-3 w-24 font-normal text-right">时长</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(track, index) in playerStore.currentPlaylist.tracks" :key="track.id"
                @dblclick="!isMultiSelectMode && playerStore.playSong(track)"
                @click.exact="handleRowClick(track, index)"
                @click.ctrl.exact="handleRowClick(track, index, { ctrl: true })"
                @click.meta.exact="handleRowClick(track, index, { ctrl: true })"
                @click.shift.exact="handleRowClick(track, index, { shift: true })"
                @contextmenu.prevent="showContextMenu($event, track)"
                class="cursor-pointer group"
                :class="{
                  'bg-blue-600/30': selectedTrackIds.includes(track.id),
                  'hover:bg-white/10': !selectedTrackIds.includes(track.id),
                  'text-green-400': playerStore.currentSong && playerStore.currentSong.id === track.id
                }">
              <td class="p-3 text-center">
                <label v-if="isMultiSelectMode" class="relative flex items-center justify-center cursor-pointer">
                   <input type="checkbox" :checked="selectedTrackIds.includes(track.id)" @change="handleRowClick(track, index)" class="sr-only peer">
                  <div class="w-5 h-5 bg-transparent border-2 border-gray-500 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                  <Check class="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
                </label>
                <span v-else class="text-gray-400 group-hover:text-white">{{ index + 1 }}</span>
              </td>
              <td class="p-3 flex items-center overflow-hidden">
                <img :src="track.al.picUrl" class="w-10 h-10 rounded mr-4 flex-shrink-0">
                <div class="truncate min-w-0">
                  <p class="font-semibold truncate text-white">{{ track.name }}</p>
                </div>
              </td>
              <td class="p-3 truncate">
                <span v-for="(artist, i) in track.ar" :key="artist.id">
                  <a @click.stop="playerStore.showArtistPage(artist.id)" class="hover:underline">{{ artist.name }}</a>
                  <span v-if="i < track.ar.length - 1"> / </span>
                </span>
              </td>
              <td class="p-3 truncate">
                <a @click.stop="playerStore.showAlbumAsPlaylist(track.al.id)" class="text-gray-300 group-hover:text-white hover:underline">{{ track.al.name }}</a>
              </td>
              <td class="p-3 w-24 text-right text-gray-300 group-hover:text-white">
                <button @click.stop="userStore.likeSong(track.id, !isLiked(track.id))" class="opacity-0 group-hover:opacity-100 transition-opacity mr-4">
                  <Heart :fill="isLiked(track.id) ? 'currentColor' : 'none'" class="w-5 h-5" :class="isLiked(track.id) ? 'text-red-500' : 'text-gray-400'" />
                </button>
                <span>{{ formatDuration(track.dt / 1000) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-else class="flex flex-col items-center justify-center h-full text-gray-400">
        <Music class="w-24 h-24 mb-4"/>
        <p class="text-xl">请先登录并选择一个歌单</p>
      </div>
      
      <div v-if="contextMenu.show" 
           class="absolute bg-[#282828] rounded-lg shadow-lg p-2 text-sm z-20"
           :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }">
        <ul>
          <li @click="handlePlayNext()" class="px-4 py-2 hover:bg-white/10 rounded-md flex items-center"><Play class="w-4 h-4 mr-2"/>下一首播放</li>
          <li @click="handleLikeSelected()" class="px-4 py-2 hover:bg-white/10 rounded-md flex items-center"><Heart class="w-4 h-4 mr-2"/>收藏到歌单</li>
        </ul>
      </div>
    </main>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, reactive } from 'vue';
  import { Music, Heart, Play, Check, ListChecks, ArrowLeft } from 'lucide-vue-next';
  import { usePlayerStore } from '../store/player';
  import { useUserStore } from '../store/user';
  import type { Track } from '../types';
  
  const playerStore = usePlayerStore();
  const userStore = useUserStore();
  
  const isMultiSelectMode = ref(false);
  const selectedTrackIds = ref<number[]>([]);
  const lastSelectedTrackIndex = ref(-1);
  
  const contextMenu = reactive({
    show: false,
    x: 0,
    y: 0,
    track: null as Track | null,
  });
  
  const isLiked = (trackId: number) => computed(() => userStore.likedSongIds.includes(trackId)).value;
  // 修复：添加可选链操作符 ?.
  const isAllSelected = computed(() => 

  
    playerStore.currentPlaylist?.tracks.length > 0 && 
    selectedTrackIds.value.length === playerStore.currentPlaylist?.tracks.length
  );
  
  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  
  const toggleMultiSelectMode = () => {
    isMultiSelectMode.value = !isMultiSelectMode.value;
    if (!isMultiSelectMode.value) {
      selectedTrackIds.value = [];
    }
  };
  
  const toggleSelectAll = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      // 修复：添加可选链操作符 ?.
      selectedTrackIds.value = playerStore.currentPlaylist?.tracks.map(t => t.id) || [];
    } else {
      selectedTrackIds.value = [];
    }
  };
  
  const handleRowClick = (track: Track, index: number, options: { ctrl?: boolean, shift?: boolean } = {}) => {
    if (!isMultiSelectMode.value) return;
  
    const trackId = track.id;
    if (options.shift && lastSelectedTrackIndex.value !== -1) {
      const start = Math.min(index, lastSelectedTrackIndex.value);
      const end = Math.max(index, lastSelectedTrackIndex.value);
      const rangeIds = playerStore.currentPlaylist?.tracks.slice(start, end + 1).map(t => t.id) || [];
      const currentSelection = new Set([...selectedTrackIds.value, ...rangeIds]);
      selectedTrackIds.value = Array.from(currentSelection);
    } else {
      const selectedIndex = selectedTrackIds.value.indexOf(trackId);
      if (selectedIndex > -1) {
        selectedTrackIds.value.splice(selectedIndex, 1);
      } else {
        selectedTrackIds.value.push(trackId);
      }
    }
    lastSelectedTrackIndex.value = index;
  };
  
  const showContextMenu = (event: MouseEvent, track: Track) => {
    if (!selectedTrackIds.value.includes(track.id)) {
      selectedTrackIds.value = [track.id];
    }
    contextMenu.show = true;
    contextMenu.x = event.clientX;
    contextMenu.y = event.clientY;
    contextMenu.track = track;
  };
  
  const getSelectedTracks = (): Track[] => {
    return playerStore.currentPlaylist?.tracks.filter(t => selectedTrackIds.value.includes(t.id)) || [];
  };
  
  const handlePlayNext = () => {
    playerStore.addNext(getSelectedTracks());
    selectedTrackIds.value = [];
    contextMenu.show = false;
  };
  
  const handleLikeSelected = async () => {
    const tracksToLike = getSelectedTracks();
    for (const track of tracksToLike) {
      if (!isLiked(track.id)) {
        await userStore.likeSong(track.id, true);
      }
    }
    alert(`已收藏 ${tracksToLike.length} 首歌曲`);
    selectedTrackIds.value = [];
    contextMenu.show = false;
  };
  </script>
  
  <style>
  main::-webkit-scrollbar { display: none; }
  main { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
  