<!-- 
  文件路径: src/components/SongDetailPage.vue
  描述: 修复了拖拽与单击的交互逻辑，确保视图切换功能正常。
-->
<template>
    <div class="absolute inset-0 bg-black/80 backdrop-blur-2xl z-20 flex flex-col text-white">
      <!-- 头部和关闭按钮 -->
      <div class="flex-shrink-0 p-4 flex justify-end">
        <button @click="playerStore.toggleDetailPage(false)" class="p-2 rounded-full bg-white/10 hover:bg-white/20">
          <ChevronDown class="w-6 h-6" />
        </button>
      </div>
  
      <!-- 主内容区 -->
      <div class="flex-1 flex overflow-hidden p-8 space-x-12">
        <!-- 左侧：封面/歌词切换区域 -->
        <div class="w-1/2 flex flex-col items-center justify-between space-y-8">
          <!-- 封面/歌词容器 -->
          <div 
            class="w-full flex-1 relative cursor-pointer" 
            @mousedown.prevent="handleContainerMouseDown"
          >
            <!-- 封面视图 -->
            <transition name="fade">
              <div v-if="playerStore.detailPageView === 'cover'" class="absolute inset-0 flex justify-center items-center">
                <img 
                  :src="playerStore.currentSong?.al.picUrl" 
                  class="w-[400px] h-[400px] object-cover rounded-full shadow-2xl"
                  :class="{ 'animate-spin-slow': playerStore.isPlaying }"
                  :style="{ animationPlayState: playerStore.isPlaying ? 'running' : 'paused' }"
                >
              </div>
            </transition>
            <!-- 歌词视图 -->
            <transition name="fade">
              <div v-if="playerStore.detailPageView === 'lyrics'" 
                   class="w-full h-full overflow-hidden relative select-none" 
                   style="mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);"
              >
                <div 
                  class="transition-transform duration-500 ease-in-out"
                  :style="{ transform: `translateY(${lyricsTranslateY}px)` }"
                >
                  <p v-for="(line, index) in playerStore.parsedLrc" :key="index"
                     class="text-3xl py-4 text-center transition-all duration-300"
                     :class="getLyricClass(index)">
                    {{ line.text }}
                  </p>
                </div>
                <div v-if="isDraggingLyrics" class="absolute top-1/2 left-0 right-0 h-px bg-blue-400 flex items-center">
                  <span class="text-xs bg-blue-400/80 px-2 py-0.5 rounded-full">{{ formatDuration(draggedLyricTime) }}</span>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- 页内音量控制 -->
          <div class="flex items-center space-x-4 w-full max-w-sm">
            <Volume1 class="text-gray-400" />
            <div ref="volumeBar" class="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer group" @mousedown.stop="onVolumeMouseDown">
              <div class="h-1.5 bg-white rounded-full relative pointer-events-none" :style="{ width: playerStore.playback.volume * 100 + '%' }"></div>
            </div>
            <Volume2 class="text-gray-400" />
          </div>
        </div>
  
        <!-- 右侧：信息与评论 -->
        <div class="w-1/2 flex flex-col overflow-hidden">
          <div class="flex-shrink-0">
            <h1 class="text-4xl font-bold">{{ playerStore.currentSong?.name }}</h1>
            <p class="text-xl text-gray-400 mt-2">{{ playerStore.currentSong?.ar.map(a => a.name).join(' / ') }}</p>
            
            <div class="flex items-center justify-between my-6">
              <div class="flex items-center space-x-2 bg-white/5 p-1 rounded-full text-sm">
                <button v-for="quality in audioQualities" :key="quality.level"
                        @click="playerStore.setAudioQuality(quality.level)"
                        :disabled="!userStore.isVip && quality.vip"
                        class="px-4 py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="playerStore.audioQuality === quality.level ? 'bg-white text-black font-bold' : 'hover:bg-white/10'">
                  {{ quality.name }}
                </button>
              </div>
              <div class="flex space-x-4 text-sm text-gray-400">
                <button @click="playerStore.setCommentSortType(2)" :class="{'text-white font-bold': playerStore.commentSortType === 2}">最热</button>
                <button @click="playerStore.setCommentSortType(3)" :class="{'text-white font-bold': playerStore.commentSortType === 3}">最新</button>
              </div>
            </div>
            <h2 class="text-2xl font-bold mb-4">评论 ({{ playerStore.currentSongComments.total }})</h2>
          </div>
          
          <div class="flex-1 overflow-y-auto pr-4" ref="commentListEl" @scroll="handleCommentScroll">
            <ul class="space-y-6">
              <CommentItem v-for="comment in playerStore.currentSongComments.hotComments" :key="comment.commentId" :comment="comment" />
              <hr class="border-white/10" v-if="playerStore.currentSongComments.hotComments.length > 0">
              <CommentItem v-for="comment in playerStore.currentSongComments.comments" :key="comment.commentId" :comment="comment" />
            </ul>
            <div v-if="playerStore.isCommentLoading" class="flex items-center justify-center py-4">
              <div class="loader"></div>
            </div>
          </div>
          
          <div class="flex-shrink-0 pt-4 flex space-x-2">
            <input 
              v-model="newCommentContent"
              placeholder="发表一条友善的评论"
              class="flex-1 bg-white/5 border-white/10 rounded-full px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              @keyup.enter="submitComment"
            />
            <button @click="submitComment" class="px-6 py-2 bg-blue-600 rounded-full text-sm hover:bg-blue-700">发送</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onUnmounted } from 'vue';
  import { usePlayerStore } from '../store/player';
  import { useUserStore } from '../store/user';
  import { ChevronDown, Volume1, Volume2 } from 'lucide-vue-next';
  import CommentItem from './CommentItem.vue';
  
  const playerStore = usePlayerStore();
  const userStore = useUserStore();
  const commentListEl = ref<HTMLElement | null>(null);
  const newCommentContent = ref('');
  
  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  
  const audioQualities = [
    { level: 'standard', name: '标准', vip: false },
    { level: 'higher', name: '较高', vip: false },
    { level: 'exhigh', name: '极高', vip: true },
    { level: 'lossless', name: '无损', vip: true },
  ] as const;
  
  // --- 歌词拖拽与点击切换逻辑 ---
  const isDraggingLyrics = ref(false);
  const hasDragged = ref(false);
  const dragStartY = ref(0);
  const dragStartTranslateY = ref(0);
  const draggedLyricTime = ref(0);
  
  const lyricsTranslateY = computed(() => {
    if (isDraggingLyrics.value) return dragStartTranslateY.value;
    const containerHeight = 500;
    const lineHeight = 64;
    const centerOffset = containerHeight / 2 - lineHeight / 2;
    if (playerStore.currentLrcIndex > -1) {
      return centerOffset - playerStore.currentLrcIndex * lineHeight;
    }
    return centerOffset;
  });
  
  const getLyricClass = (index: number) => {
    if (isDraggingLyrics.value) {
      const containerHeight = 500;
      const lineHeight = 64;
      const centerLineIndex = Math.max(0, Math.min(playerStore.parsedLrc.length - 1, Math.round((-dragStartTranslateY.value + containerHeight / 2 - lineHeight / 2) / lineHeight)));
      return index === centerLineIndex ? 'font-bold text-blue-400 scale-105' : 'text-gray-500 scale-95';
    }
    return index === playerStore.currentLrcIndex ? 'font-bold text-white scale-100' : 'text-gray-500 scale-95';
  };
  
  const handleContainerMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    hasDragged.value = false;
  
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // 只要移动了超过一个微小的阈值，就判定为拖拽
      if (Math.abs(moveEvent.clientY - dragStartY.value) > 5) {
        hasDragged.value = true;
      }
      
      if (isDraggingLyrics.value) {
        const deltaY = moveEvent.clientY - dragStartY.value;
        dragStartTranslateY.value += deltaY;
        dragStartY.value = moveEvent.clientY;
  
        const containerHeight = 500;
        const lineHeight = 64;
        const centerLineIndex = Math.max(0, Math.min(playerStore.parsedLrc.length - 1, Math.round((-dragStartTranslateY.value + containerHeight / 2 - lineHeight / 2) / lineHeight)));
        draggedLyricTime.value = playerStore.parsedLrc[centerLineIndex]?.time || 0;
      }
    };
  
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
  
      if (isDraggingLyrics.value) {
        playerStore.setAudioTime(draggedLyricTime.value);
      } else if (!hasDragged.value) {
        // 如果没有发生拖拽，则判定为单击
        playerStore.toggleDetailView();
      }
      isDraggingLyrics.value = false;
    };
    
    if (playerStore.detailPageView === 'lyrics') {
      isDraggingLyrics.value = true;
      dragStartY.value = e.clientY;
      dragStartTranslateY.value = lyricsTranslateY.value;
    }
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  // --- 评论滚动加载 ---
  const handleCommentScroll = () => {
    const el = commentListEl.value;
    if (el) {
      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1;
      if (isAtBottom) {
        playerStore.fetchComments();
      }
    }
  };
  
  // --- 音量控制 ---
  const volumeBar = ref<HTMLElement | null>(null);
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
  
  // --- 发送评论 ---
  const submitComment = async () => {
    if (!newCommentContent.value.trim()) return;
    const success = await playerStore.postComment(newCommentContent.value);
    if (success) {
      newCommentContent.value = '';
    }
  };
  
  onUnmounted(() => {
    // 虽然mouseup会移除，但作为保险措施，在组件卸载时也移除
    // window.removeEventListener('mousemove', handleLyricMouseMove);
    // window.removeEventListener('mouseup', handleContainerMouseUp);
  });
  </script>
  
  <style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
    position: absolute;
  }
  
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .animate-spin-slow { animation: spin 20s linear infinite; }
  
  .loader {
    border: 4px solid #f3f3f3;
    border-radius: 50%;
    border-top: 4px solid #c0392b;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  </style>
  