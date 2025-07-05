<!-- 
  文件路径: src/components/SideBar.vue
  描述: 在加载新歌单时，禁用列表点击，防止重复请求。
-->
<template>
    <aside 
      class="bg-[#121212] flex-shrink-0 flex flex-col p-2 relative transition-all duration-300 ease-in-out"
      :class="userStore.isSidebarCollapsed ? 'w-24' : 'w-64'"
    >
      <!-- 切换按钮 -->
      <div class="flex mb-2" :class="userStore.isSidebarCollapsed ? 'justify-center' : 'justify-end'">
        <button @click="userStore.toggleSidebar()" class="p-2 rounded-full hover:bg-gray-700 transition-colors" title="收起/展开侧边栏">
          <PanelLeftClose v-if="!userStore.isSidebarCollapsed" class="w-5 h-5" />
          <PanelRightClose v-else class="w-5 h-5" />
        </button>
      </div>
  
      <!-- 登录区域 -->
      <div class="bg-[#181818] rounded-lg p-4 mb-2" v-if="!userStore.isSidebarCollapsed">
        <!-- ... (代码保持不变) ... -->
      </div>
  
      <!-- 歌单列表 -->
      <div 
        class="bg-[#181818] rounded-lg flex-1 overflow-y-auto overflow-x-hidden transition-opacity"
        :class="{'opacity-50 pointer-events-none': playerStore.isLoading}"
      >
        <h2 class="text-lg font-bold p-4 pb-2" v-if="!userStore.isSidebarCollapsed">我的音乐</h2>
        <ul v-if="userStore.profile" class="space-y-1 p-2">
          <li
            @click="playerStore.showLikedSongs()"
            :title="userStore.isSidebarCollapsed ? '我喜欢的音乐' : ''"
            class="flex items-center p-2 hover:bg-[#282828] cursor-pointer rounded-md truncate"
            :class="{ 
              'bg-blue-600 text-white': playerStore.currentPlaylist && playerStore.currentPlaylist.id === LIKED_SONGS_PLAYLIST_ID,
              'justify-center': userStore.isSidebarCollapsed
            }">
            <div class="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md mr-3">
              <Heart class="w-5 h-5 text-white" />
            </div>
            <span v-if="!userStore.isSidebarCollapsed" class="font-semibold">我喜欢的音乐</span>
          </li>
          <hr v-if="!userStore.isSidebarCollapsed && userStore.playlists.length > 0" class="border-gray-700 my-2">
          <li v-for="playlist in userStore.playlists" :key="playlist.id"
              @click="playerStore.getPlaylistDetail(playlist.id)"
              :title="userStore.isSidebarCollapsed ? playlist.name : ''"
              class="flex items-center p-2 hover:bg-[#282828] cursor-pointer rounded-md truncate"
              :class="{ 
                'bg-blue-600 text-white': playerStore.currentPlaylist && playerStore.currentPlaylist.id === playlist.id,
                'justify-center': userStore.isSidebarCollapsed
              }">
              <img 
                :src="playlist.coverImgUrl"
                @error="($event.target as HTMLImageElement).src = 'https://placehold.co/40x40/181818/333333?text=...'"
                class="w-8 h-8 rounded-md mr-3 flex-shrink-0" 
                alt="playlist cover"
              >
            <span v-if="!userStore.isSidebarCollapsed" class="text-sm">{{ playlist.name }}</span>
          </li>
        </ul>
        <div v-if="userStore.isLoading.playlists" class="p-4 text-center">
          <div class="loader mx-auto"></div>
        </div>
      </div>
    </aside>
  </template>
  
  <script setup lang="ts">
  import { useUserStore } from '../store/user';
  import { usePlayerStore, LIKED_SONGS_PLAYLIST_ID } from '../store/player';
  import { Heart, LogOut, PanelLeftClose, PanelRightClose, Music } from 'lucide-vue-next';
  
  const userStore = useUserStore();
  const playerStore = usePlayerStore();
  </script>
  