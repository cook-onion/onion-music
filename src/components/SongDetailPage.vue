<!-- 
  文件路径: src/components/SongDetailPage.vue
  描述: 歌曲封面已修改为圆形并添加了旋转动画。
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
        <div class="w-1/2 flex flex-col items-center justify-center space-y-8 relative cursor-pointer" @click="playerStore.toggleDetailView()">
          <!-- 封面视图 -->
          <transition name="fade">
            <div v-if="playerStore.detailPageView === 'cover'" class="w-full flex justify-center items-center">
              <!-- 核心修改：添加了 animate-spin-slow 和 rounded-full 类，并绑定了 animationPlayState 样式 -->
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
            <div v-if="playerStore.detailPageView === 'lyrics'" class="w-full h-full overflow-hidden relative" style="mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);">
              <div 
                class="transition-transform duration-500 ease-in-out"
                :style="{ transform: `translateY(${lyricsTranslateY}px)` }"
              >
                <p v-for="(line, index) in playerStore.parsedLrc" :key="index"
                   class="text-3xl py-4 text-center transition-all duration-300"
                   :class="index === playerStore.currentLrcIndex ? 'font-bold text-white scale-100' : 'text-gray-500 scale-95'">
                  {{ line.text }}
                </p>
              </div>
            </div>
          </transition>
        </div>
  
        <!-- 右侧：信息与评论 -->
        <div class="w-1/2 flex flex-col overflow-hidden">
          <div class="flex-shrink-0">
            <h1 class="text-4xl font-bold">{{ playerStore.currentSong?.name }}</h1>
            <p class="text-xl text-gray-400 mt-2">{{ playerStore.currentSong?.ar.map(a => a.name).join(' / ') }}</p>
            
            <!-- 音质切换 -->
            <div class="flex items-center space-x-2 bg-white/5 p-1 rounded-full text-sm my-6">
              <button v-for="quality in audioQualities" :key="quality.level"
                      @click="playerStore.setAudioQuality(quality.level)"
                      :disabled="!userStore.isVip && quality.vip"
                      class="px-4 py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      :class="playerStore.audioQuality === quality.level ? 'bg-white text-black font-bold' : 'hover:bg-white/10'">
                {{ quality.name }}
              </button>
            </div>
  
            <!-- 评论区头部 -->
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold">评论 ({{ playerStore.currentSongComments.total }})</h2>
              <div class="flex space-x-4 text-sm text-gray-400">
                <button @click="playerStore.setCommentSortType(2)" :class="{'text-white font-bold': playerStore.commentSortType === 2}">最热</button>
                <button @click="playerStore.setCommentSortType(3)" :class="{'text-white font-bold': playerStore.commentSortType === 3}">最新</button>
              </div>
            </div>
          </div>
          
          <!-- 评论列表 -->
          <div class="flex-1 overflow-y-auto" ref="commentListEl" @scroll="handleCommentScroll">
            <ul class="space-y-6">
              <CommentItem v-for="comment in playerStore.currentSongComments.hotComments" :key="comment.commentId" :comment="comment" />
              <hr class="border-white/10" v-if="playerStore.currentSongComments.hotComments.length > 0">
              <CommentItem v-for="comment in playerStore.currentSongComments.comments" :key="comment.commentId" :comment="comment" />
            </ul>
            <div v-if="playerStore.isCommentLoading" class="flex items-center justify-center py-4">
              <div class="loader"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { usePlayerStore } from '../store/player';
  import { useUserStore } from '../store/user';
  import { ChevronDown } from 'lucide-vue-next';
  import CommentItem from './CommentItem.vue';
  
  const playerStore = usePlayerStore();
  const userStore = useUserStore();
  const commentListEl = ref<HTMLElement | null>(null);
  
  const audioQualities = [
    { level: 'standard', name: '标准', vip: false },
    { level: 'higher', name: '较高', vip: false },
    { level: 'exhigh', name: '极高', vip: true },
    { level: 'lossless', name: '无损', vip: true },
  ] as const ;
  
  const lyricsTranslateY = computed(() => {
    const containerHeight = commentListEl.value?.clientHeight || 500;
    const lineHeight = 64; // Corresponds to py-4 (1rem * 2) and text-3xl line-height
    const centerOffset = containerHeight / 2 - lineHeight / 2;
    if (playerStore.currentLrcIndex > -1) {
      return centerOffset - playerStore.currentLrcIndex * lineHeight;
    }
    return centerOffset;
  });
  
  const handleCommentScroll = () => {
    const el = commentListEl.value;
    if (el) {
      const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1;
      if (isAtBottom) {
        playerStore.fetchComments();
      }
    }
  };
  </script>
  
  <style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
    position: absolute; /* Prevent layout shift during transition */
  }
  
  /* 核心修改：定义旋转动画 */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .animate-spin-slow {
    animation: spin 20s linear infinite;
  }
  
  .loader {
    border: 4px solid #f3f3f3;
    border-radius: 50%;
    border-top: 4px solid #c0392b;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  </style>
  