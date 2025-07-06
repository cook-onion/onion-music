<!-- 
  文件路径: src/components/SideBar.vue
  描述: 将“我喜欢的音乐”替换为“听歌排行”。
-->
<template>
    <aside 
      class="bg-[#121212] flex-shrink-0 flex flex-col p-2 relative transition-all duration-300 ease-in-out"
      :class="userStore.isSidebarCollapsed ? 'w-24' : 'w-64'"
    >
      <div class="flex mb-2" :class="userStore.isSidebarCollapsed ? 'justify-center' : 'justify-end'">
        <button @click="userStore.toggleSidebar()" class="p-2 rounded-full hover:bg-gray-700 transition-colors" title="收起/展开侧边栏">
          <PanelLeftClose v-if="!userStore.isSidebarCollapsed" class="w-5 h-5" />
          <PanelRightClose v-else class="w-5 h-5" />
        </button>
      </div>
  
      <div class="bg-[#181818] rounded-lg p-4 mb-2" v-if="!userStore.isSidebarCollapsed">
        <div v-if="!userStore.profile" class="flex flex-col items-center">
          <h2 class="text-lg font-bold mb-2">登录网易云</h2>
          <p class="text-xs text-gray-400 mb-4 text-center">扫描二维码登录</p>
          <div v-if="userStore.qr.img" class="relative w-40 h-40 bg-white p-2 rounded-lg flex items-center justify-center">
            <img :src="userStore.qr.img" alt="QR Code">
            <div v-if="userStore.qr.status === 800" @click="userStore.loginWithQRCode()" class="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white cursor-pointer rounded-lg">
              <p>二维码已失效</p><p class="text-xs">点击刷新</p>
            </div>
            <div v-if="userStore.qr.status === 802" class="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white rounded-lg">
              <div class="loader mb-2"></div><p>请在手机上确认</p>
            </div>
          </div>
          <button v-else @click="userStore.loginWithQRCode()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
            {{ userStore.isLoading.qr ? '生成中...' : '点击生成二维码' }}
          </button>
        </div>
        <div v-else class="flex items-center justify-between">
          <div class="flex items-center min-w-0">
            <img :src="userStore.profile.avatarUrl" class="w-12 h-12 rounded-full mr-4 flex-shrink-0">
            <div class="truncate">
              <p class="font-bold truncate">{{ userStore.profile.nickname }}</p>
              <p class="text-xs text-gray-400">Lv.{{ userStore.level }}</p>
            </div>
          </div>
          <button @click="userStore.logout()" title="退出登录" class="p-2 rounded-full hover:bg-white/10 transition-colors">
            <LogOut class="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>
  
      <div 
        class="bg-[#181818] rounded-lg flex-1 overflow-y-auto overflow-x-hidden transition-opacity"
        :class="{'opacity-50 pointer-events-none': playerStore.isLoading}"
      >
        <h2 class="text-lg font-bold p-4 pb-2" v-if="!userStore.isSidebarCollapsed">我的音乐</h2>
        <ul v-if="userStore.profile" class="space-y-1 p-2">
          <li
            @click="playerStore.showUserRecord('weekly')"
            :title="userStore.isSidebarCollapsed ? '听歌排行' : ''"
            class="flex items-center p-2 hover:bg-[#282828] cursor-pointer rounded-md truncate"
            :class="{ 
              'bg-blue-600 text-white': playerStore.currentRecordType !== null,
              'justify-center': userStore.isSidebarCollapsed
            }">
            <div class="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md mr-3">
              <BarChart2 class="w-5 h-5 text-white" />
            </div>
            <span v-if="!userStore.isSidebarCollapsed" class="font-semibold">听歌排行</span>
          </li>
  
        
  
          <hr v-if="!userStore.isSidebarCollapsed && userStore.playlists.length > 0" class="border-gray-700 my-2">
          <li v-for="playlist in userStore.playlists" :key="playlist.id"
              @click="playerStore.getPlaylistDetail(playlist.id)"
              :title="userStore.isSidebarCollapsed ? playlist.name : ''"
              class="flex items-center p-2 hover:bg-[#282828] cursor-pointer rounded-md truncate"
              :class="{ 
                'bg-blue-600 text-white': playerStore.currentPlaylist && playerStore.currentPlaylist.id === playlist.id && playerStore.currentRecordType === null,
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
  import { Heart, LogOut, PanelLeftClose, PanelRightClose, BarChart2 } from 'lucide-vue-next';
  
  const userStore = useUserStore();
  const playerStore = usePlayerStore();
  </script>
  