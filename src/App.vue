<!-- 
  文件路径: src/App.vue
  描述: 应用主组件，实现基于歌曲封面的动态模糊背景。
-->
<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden text-gray-300 font-sans relative">
    <!-- 动态模糊背景层 -->
    <div 
      class="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out -z-10"
      :style="{ 
        backgroundImage: `url(${playerStore.currentCoverUrl})`,
        filter: 'blur(50px) brightness(0.6)',
        transform: 'scale(1.1)'
      }"
    ></div>

    <!-- 内容层，现在是透明的，颜色交由子组件控制 -->
    <div class="h-full w-full flex flex-1 overflow-hidden">
      <SideBar />
      <MainContent />
    </div>
    
    <PlayerFooter />
    <transition
      enter-active-class="transition-transform duration-500 ease-in-out"
      leave-active-class="transition-transform duration-500 ease-in-out"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <SongDetailPage v-if="playerStore.isDetailPageVisible" />
    </transition>
    <audio
      ref="audioPlayer"
      @timeupdate="playerStore.updateProgress()"
      @loadedmetadata="playerStore.onLoadedMetadata()"
      @ended="playerStore.onPlayEnded()"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SideBar from './components/SideBar.vue';
import MainContent from './components/MainContent.vue';
import PlayerFooter from './components/PlayerFooter.vue';
import SongDetailPage from './components/SongDetailPage.vue'; // 引入新组件
import { usePlayerStore } from './store/player';
import { useUserStore } from './store/user';

const audioPlayer = ref<HTMLAudioElement | null>(null);
const playerStore = usePlayerStore();
const userStore = useUserStore();

onMounted(() => {
  userStore.tryLoadFromCache();
  if (audioPlayer.value) {
    playerStore.init(audioPlayer.value);
  }
});
</script>

<style>
/* 全局样式保持不变 */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #191919; }
::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #555; }
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
