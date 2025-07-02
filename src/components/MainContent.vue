<!-- 
  文件路径: src/components/MainContent.vue
  描述: 移除了@tailwindcss/forms依赖，并手动实现了自定义复选框。
-->
<template>
    <main 
      class="flex-1 overflow-y-auto bg-gradient-to-b from-[#222] to-[#121212] relative"
      @click="contextMenu.show = false"
    >
      <!-- 多选操作栏 -->
      <div v-if="selectedTrackIds.length > 0" class="sticky top-0 bg-[#121212]/80 backdrop-blur-sm p-4 z-10 flex items-center justify-between">
        <span class="text-sm font-bold">已选择 {{ selectedTrackIds.length }} 首歌曲</span>
        <div class="flex items-center space-x-4">
          <button @click="handlePlayNext" class="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors">
            <Play class="w-5 h-5" />
            <span>下一首播放</span>
          </button>
          <button @click="handleLikeSelected" class="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Heart class="w-5 h-5" />
            <span>收藏</span>
          </button>
        </div>
      </div>
  
      <div v-if="playerStore.currentPlaylist && !playerStore.isLoading" class="p-6">
        <!-- 歌单头部信息 -->
        <div class="flex items-end mb-8">
          <img :src="playerStore.currentPlaylist.coverImgUrl" class="w-48 h-48 rounded-lg shadow-lg mr-6 flex-shrink-0">
          <div class="overflow-hidden">
            <p class="text-sm">歌单</p>
            <h1 class="text-5xl font-extrabold mb-4 truncate">{{ playerStore.currentPlaylist.name }}</h1>
            <p class="text-gray-200 text-sm truncate">{{ playerStore.currentPlaylist.description }}</p>
          </div>
        </div>
        <!-- 歌曲列表 -->
        <table class="w-full text-left table-fixed">
          <thead class="text-gray-300 border-b border-white/10 text-sm">
            <tr>
              <th class="p-3 w-16 text-center font-normal">
                <!-- 自定义复选框实现 -->
                <label class="relative flex items-center justify-center cursor-pointer">
                  <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" class="sr-only peer">
                  <div class="w-5 h-5 bg-transparent border-2 border-gray-500 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                  <Check class="w-4 h-4 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" />
                </label>
              </th>
              <th class="p-3 font-normal">标题</th>
              <th class="p-3 font-normal">专辑</th>
              <th class="p-3 w-32 font-normal text-right">时长</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(track, index) in playerStore.currentPlayingList" :key="track.id"
                @dblclick="playerStore.playSong(track)"
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
                 <!-- 自定义复选框实现 -->
                <div class="relative flex items-center justify-center pointer-events-none">
                  <div class="w-5 h-5 bg-transparent border-2 border-gray-500 rounded" :class="{'bg-blue-600 border-blue-600': selectedTrackIds.includes(track.id)}"></div>
                  <Check class="w-4 h-4 text-white absolute transition-opacity" :class="selectedTrackIds.includes(track.id) ? 'opacity-100' : 'opacity-0'" />
                </div>
              </td>
              <td class="p-3 flex items-center overflow-hidden">
                <img :src="track.al.picUrl" class="w-10 h-10 rounded mr-4 flex-shrink-0">
                <div class="truncate min-w-0">
                  <p class="font-semibold truncate text-white">{{ track.name }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ track.ar.map(a => a.name).join(' / ') }}</p>
                </div>
              </td>
              <td class="p-3 truncate text-gray-300 group-hover:text-white">{{ track.al.name }}</td>
              <td class="p-3 w-32 text-right text-gray-300 group-hover:text-white flex items-center justify-end space-x-4">
                <button @click.stop="userStore.likeSong(track.id, !isLiked(track.id))" class="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart :fill="isLiked(track.id) ? 'currentColor' : 'none'" class="w-5 h-5" :class="isLiked(track.id) ? 'text-red-500' : 'text-gray-400'" />
                </button>
                <span>{{ formatDuration(track.dt / 1000) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 加载与空状态 (保持不变) -->
      <div v-if="playerStore.isLoading" class="flex items-center justify-center h-full">...</div>
      <div v-if="!playerStore.currentPlaylist && !playerStore.isLoading" class="flex flex-col items-center justify-center h-full text-gray-400">...</div>
      
      <!-- 右键上下文菜单 -->
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
  import { Music, Heart, Play, Check } from 'lucide-vue-next';
  import { usePlayerStore } from '../store/player';
  import { useUserStore } from '../store/user';
  import type { Track } from '../types';
  
  const playerStore = usePlayerStore();
  const userStore = useUserStore();
  
  const selectedTrackIds = ref<number[]>([]);
  const lastSelectedTrackIndex = ref(-1);
  
  const contextMenu = reactive({
    show: false,
    x: 0,
    y: 0,
    track: null as Track | null,
  });
  
  const isLiked = (trackId: number) => computed(() => userStore.likedSongIds.includes(trackId)).value;
  const isAllSelected = computed(() => 
    playerStore.currentPlayingList.length > 0 && 
    selectedTrackIds.value.length === playerStore.currentPlayingList.length
  );
  
  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  
  const toggleSelectAll = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      selectedTrackIds.value = playerStore.currentPlayingList.map(t => t.id);
    } else {
      selectedTrackIds.value = [];
    }
  };
  
  const handleRowClick = (track: Track, index: number, options: { ctrl?: boolean, shift?: boolean } = {}) => {
    if (options.shift && lastSelectedTrackIndex.value !== -1) {
      const start = Math.min(index, lastSelectedTrackIndex.value);
      const end = Math.max(index, lastSelectedTrackIndex.value);
      const rangeIds = playerStore.currentPlayingList.slice(start, end + 1).map(t => t.id);
      const currentSelection = new Set([...selectedTrackIds.value, ...rangeIds]);
      selectedTrackIds.value = Array.from(currentSelection);
    } else if (options.ctrl) {
      const selectedIndex = selectedTrackIds.value.indexOf(track.id);
      if (selectedIndex > -1) {
        selectedTrackIds.value.splice(selectedIndex, 1);
      } else {
        selectedTrackIds.value.push(track.id);
      }
    } else {
      selectedTrackIds.value = [track.id];
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
    return playerStore.currentPlayingList.filter(t => selectedTrackIds.value.includes(t.id));
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
  /* 移除了对 @tailwindcss/forms 的依赖 */
  main::-webkit-scrollbar { display: none; }
  main { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
  