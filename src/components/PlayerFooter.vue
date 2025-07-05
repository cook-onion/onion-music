<!-- 
  文件路径: src/components/PlayerFooter.vue
  描述: 播放器组件，已添加动态歌词并调整了按钮布局。
-->
<template>
    <footer 
      class="h-24 bg-[#181818] border-t border-white/10 flex-shrink-0 flex items-center justify-between px-4 relative"
    >
      <!-- 播放列表面板 -->
      <div v-if="showPlaylist" v-on-click-outside="() => showPlaylist = false" class="absolute bottom-full right-0 mb-2 w-96 max-h-96 bg-[#282828] rounded-lg shadow-2xl p-2 overflow-y-auto z-30">
        <h3 class="text-lg font-bold p-2">播放列表 ({{ playerStore.playQueue.length }})</h3>
        <ul>
          <li 
            v-for="(track, index) in playerStore.playQueue" 
            :key="track.id + '-' + index"
            @dblclick="playerStore.playSong(track)"
            class="flex items-center justify-between p-2 rounded-md hover:bg-white/10 cursor-pointer"
            :class="{'text-green-400': playerStore.currentSong?.id === track.id}"
          >
            <div class="flex items-center truncate">
              <span class="w-6 text-center text-xs mr-2">{{ index + 1 }}</span>
              <img :src="track.al.picUrl" class="w-8 h-8 rounded-sm mr-3 flex-shrink-0">
              <div class="truncate">
                <p class="truncate text-sm">{{ track.name }}</p>
                <p class="truncate text-xs text-gray-400">{{ track.ar.map(a => a.name).join(' / ') }}</p>
              </div>
            </div>
            <span class="text-xs text-gray-400 flex-shrink-0 ml-4">{{ formatDuration(track.dt / 1000) }}</span>
          </li>
        </ul>
      </div>
  
      <!-- 左侧歌曲信息 -->
      <div class="flex items-center w-1/4 min-w-0">
        <img v-if="playerStore.currentSong" :src="playerStore.currentSong.al.picUrl" class="w-16 h-16 rounded-md mr-4 flex-shrink-0">
        <div v-if="playerStore.currentSong" class="truncate">
          <p class="font-bold truncate">{{ playerStore.currentSong.name }}</p>
          <p class="text-xs text-gray-400 truncate">{{ playerStore.currentSong.ar.map(a => a.name).join(' / ') }}</p>
        </div>
        <div v-else class="text-gray-500">未选择歌曲</div>
      </div>
  
      <!-- 中间播放控制 -->
      <div class="flex flex-col items-center justify-center w-1/2">
        <div class="flex items-center space-x-4">
          <button @click="playerStore.changePlayMode()" title="切换播放模式" class="p-2 rounded-full hover:bg-white/10 transition-colors relative">
            <Shuffle class="cursor-pointer" :class="playerStore.playMode === 'RANDOM' ? 'text-blue-400' : 'text-gray-400'" />
             <div v-if="playerStore.playMode === 'RANDOM'" class="w-1 h-1 bg-blue-400 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
          </button>
          <button @click="playerStore.playPrevious()" class="p-2 rounded-full hover:bg-white/10 transition-colors">
            <SkipBack class="cursor-pointer text-gray-200"/>
          </button>
          <div @click="playerStore.togglePlayPause()" class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
            <Pause v-if="playerStore.isPlaying" class="w-7 h-7"/>
            <Play v-else class="w-7 h-7 ml-1"/>
          </div>
          <button @click="playerStore.playNext()" class="p-2 rounded-full hover:bg-white/10 transition-colors">
            <SkipForward class="cursor-pointer text-gray-200"/>
          </button>
          <!-- 播放列表按钮移动到此处 -->
          <button @click.stop="showPlaylist = !showPlaylist" class="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ListMusic class="w-5 h-5" :class="showPlaylist ? 'text-blue-400' : 'text-gray-400'"/>
          </button>
          <!-- 循环模式按钮 -->
          <button @click="playerStore.changePlayMode()" title="切换播放模式" class="p-2 rounded-full hover:bg-white/10 transition-colors relative">
            <Repeat1 v-if="playerStore.playMode === 'SINGLE'" class="cursor-pointer text-blue-400" />
            <Repeat v-else class="cursor-pointer" :class="playerStore.playMode === 'LIST' ? 'text-blue-400' : 'text-gray-400'" />
            <div v-if="playerStore.playMode !== 'RANDOM'" class="w-1 h-1 bg-blue-400 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
          </button>
        </div>
        <div class="flex items-center w-full mt-2 space-x-2 text-xs">
          <span>{{ formatDuration(draggedTime !== null ? draggedTime : playerStore.playback.currentTime) }}</span>
          <div 
            ref="progressBar"
            class="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer group" 
            @mousedown="onProgressMouseDown"
          >
            <div class="h-1.5 bg-white rounded-full relative pointer-events-none" :style="{ width: progressBarWidth }">
               <div class="absolute right-0 top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          </div>
          <span>{{ formatDuration(playerStore.playback.duration) }}</span>
        </div>
      </div>
      
      <!-- 右侧区域: 歌词 + 音量控制 -->
      <div class="flex items-center justify-end w-1/4 space-x-4">
        <!-- 动态歌词显示区域 -->
        <div class="w-64 h-16 overflow-hidden relative text-center" v-if="playerStore.parsedLrc.length > 0">
          <div 
            class="absolute inset-0" 
            style="mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);"
          >
            <div 
              class="transition-transform duration-500 ease-in-out"
              :style="{ transform: `translateY(${lyricsTranslateY}px)` }"
            >
              <p 
                v-for="(line, index) in playerStore.parsedLrc" 
                :key="index"
                class="text-sm h-8 flex items-center justify-center transition-all duration-300"
                :class="index === lyricIndexToDisplay ? 'text-white font-bold scale-105' : 'text-gray-500 scale-95'"
              >
                {{ line.text }}
              </p>
            </div>
          </div>
        </div>
  
        <!-- 音量控制 -->
        <div class="flex items-center space-x-2">
          <Volume2/>
          <div 
            ref="volumeBar"
            class="w-24 h-1.5 bg-white/20 rounded-full cursor-pointer group" 
            @mousedown="onVolumeMouseDown"
          >
            <div class="h-1.5 bg-white rounded-full relative pointer-events-none" :style="{ width: playerStore.playback.volume * 100 + '%' }">
              <div class="absolute right-0 top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </template>
  
  <script setup lang="ts">
  import { ref, onUnmounted, computed } from 'vue';
  import { vOnClickOutside } from '@vueuse/components'
  import { Play, Pause, Shuffle, SkipBack, SkipForward, Repeat, Repeat1, Volume2, ListMusic } from 'lucide-vue-next';
  import { usePlayerStore } from '../store/player';
  
  const playerStore = usePlayerStore();
  const progressBar = ref<HTMLElement | null>(null);
  const volumeBar = ref<HTMLElement | null>(null);
  const showPlaylist = ref(false);
  
  const isDraggingProgress = ref(false);
  const draggedTime = ref<number | null>(null);
  
  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  
  const lyricIndexToDisplay = computed(() => {
    const time = draggedTime.value !== null ? draggedTime.value : playerStore.playback.currentTime;
    if (playerStore.parsedLrc.length > 0) {
      for (let i = playerStore.parsedLrc.length - 1; i >= 0; i--) {
        if (time >= playerStore.parsedLrc[i].time) {
          return i;
        }
      }
    }
    return -1;
  });
  
  const lyricsTranslateY = computed(() => {
    const centerOffset = 16;
    if (lyricIndexToDisplay.value > -1) {
      return centerOffset - lyricIndexToDisplay.value * 32;
    }
    return centerOffset;
  });
  
  const progressBarWidth = computed(() => {
    if (playerStore.playback.duration === 0) return '0%';
    const time = draggedTime.value !== null ? draggedTime.value : playerStore.playback.currentTime;
    return `${(time / playerStore.playback.duration) * 100}%`;
  });
  
  const onProgressMouseDown = (event: MouseEvent) => {
    if (!playerStore.currentSong) return;
    isDraggingProgress.value = true;
    updateDraggedTime(event);
    window.addEventListener('mousemove', onProgressMouseMove);
    window.addEventListener('mouseup', onProgressMouseUp);
  };
  const onProgressMouseMove = (event: MouseEvent) => {
    if (isDraggingProgress.value) {
      updateDraggedTime(event);
    }
  };
  const onProgressMouseUp = () => {
    if (isDraggingProgress.value && draggedTime.value !== null) {
      playerStore.setAudioTime(draggedTime.value);
    }
    isDraggingProgress.value = false;
    draggedTime.value = null;
    window.removeEventListener('mousemove', onProgressMouseMove);
    window.removeEventListener('mouseup', onProgressMouseUp);
  };
  const updateDraggedTime = (event: MouseEvent) => {
    if (!progressBar.value) return;
    const rect = progressBar.value.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newProgress = Math.max(0, Math.min(1, clickX / width));
    draggedTime.value = newProgress * playerStore.playback.duration;
  };
  
  const onVolumeMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    updateVolumeFromEvent(event);
    window.addEventListener('mousemove', onVolumeMouseMove);
    window.addEventListener('mouseup', onVolumeMouseUp);
  };
  const onVolumeMouseMove = (event: MouseEvent) => {
    updateVolumeFromEvent(event);
  };
  const onVolumeMouseUp = () => {
    window.removeEventListener('mousemove', onVolumeMouseMove);
    window.removeEventListener('mouseup', onVolumeMouseUp);
  };
  const updateVolumeFromEvent = (event: MouseEvent) => {
    if (!volumeBar.value) return;
    const rect = volumeBar.value.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newVolume = Math.max(0, Math.min(1, clickX / width));
    playerStore.setAudioVolume(newVolume);
  };
  
  onUnmounted(() => {
    window.removeEventListener('mousemove', onProgressMouseMove);
    window.removeEventListener('mouseup', onProgressMouseUp);
    window.removeEventListener('mousemove', onVolumeMouseMove);
    window.removeEventListener('mouseup', onVolumeMouseUp);
  });
  </script>
  