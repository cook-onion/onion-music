// 文件路径: src/store/user.ts

import { defineStore } from 'pinia';
import type { UserProfile, Playlist } from '../types';
import { apiFetch } from '../services/api';

// 定义缓存的Key和有效期（一周，单位：毫秒）
const CACHE_KEY = 'userSession';
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null as UserProfile | null,
    level: 0,
    cookie: null as string | null,
    isSidebarCollapsed: false, // 新增：控制侧边栏收缩状态
    qr: {
      key: '',
      img: '',
      status: 0,
      checkInterval: null as number | null,
    },
    playlists: [] as Playlist[],
    likedSongIds: [] as number[],
    isLoading: {
      qr: false,
      playlists: false,
    },
  }),

  actions: {
    // 新增：切换侧边栏状态的方法

      // 新增：喜欢/取消喜欢一首歌
      async likeSong(trackId: number, like: boolean = true) {
        if (!this.cookie) {
          alert('请先登录');
          return;
        }
        try {
          const res = await apiFetch(`/like?id=${trackId}&like=${like}&timestamp=${Date.now()}&cookie=${encodeURIComponent(this.cookie)}`);
          if (res.code === 200) {
            if (like) {
              // 添加到喜欢列表
              if (!this.likedSongIds.includes(trackId)) {
                this.likedSongIds.push(trackId);
              }
            } else {
              // 从喜欢列表移除
              this.likedSongIds = this.likedSongIds.filter(id => id !== trackId);
            }
          } else {
            throw new Error(res.message || '操作失败');
          }
        } catch (error) {
          console.error('喜欢/取消喜欢歌曲失败:', error);
          alert('操作失败，请稍后再试');
        }
      },

    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    
    // ... (其他方法保持不变) ...
    async loginWithQRCode() {
      this.isLoading.qr = true;
      try {
        const keyRes = await apiFetch(`/login/qr/key?timestamp=${Date.now()}`);
        this.qr.key = keyRes.data.unikey;
        const createRes = await apiFetch(`/login/qr/create?key=${this.qr.key}&qrimg=true&timestamp=${Date.now()}`);
        this.qr.img = createRes.data.qrimg;
        this.qr.status = 801;
        this.checkQRStatus();
      } catch (error) {
        console.error("二维码登录失败:", error);
      } finally {
        this.isLoading.qr = false;
      }
    },
    checkQRStatus() {
      if (this.qr.checkInterval) clearInterval(this.qr.checkInterval);
      this.qr.checkInterval = window.setInterval(async () => {
        if (!this.qr.key) return;
        try {
          const res = await apiFetch(`/login/qr/check?key=${this.qr.key}&timestamp=${Date.now()}`);
          this.qr.status = res.code;
          if (res.code === 803) {
            if (this.qr.checkInterval) clearInterval(this.qr.checkInterval);
            this.cookie = res.cookie;
            await this.getLoginStatus(res.cookie);
          }
          if (res.code === 800) {
            if (this.qr.checkInterval) clearInterval(this.qr.checkInterval);
          }
        } catch (error) {
          console.error("检查二维码状态失败:", error);
          if (this.qr.checkInterval) clearInterval(this.qr.checkInterval);
        }
      }, 3000);
    },
    async getLoginStatus(cookie: string) {
      try {
        const statusRes = await apiFetch(`/login/status?timestamp=${Date.now()}&cookie=${encodeURIComponent(cookie)}`);
        if (statusRes.data.code === 200 && statusRes.data.profile) {
          this.profile = statusRes.data.profile;
          await this.getUserAccountInfo();
          if (this.profile) {
            await this.getUserPlaylists(this.profile.userId);
            await this.fetchLikelist(this.profile.userId);
          }
          this.saveSessionToCache();
        }
      } catch (e) {
        console.error('获取登录状态的请求失败', e);
        alert('获取登录状态失败！请检查API服务CORS设置。');
      }
    },
    async getUserAccountInfo() {
      if (!this.cookie) return;
      const levelRes = await apiFetch(`/user/level?cookie=${encodeURIComponent(this.cookie)}`);
      this.level = levelRes.data.level;
    },
    async getUserPlaylists(uid: number) {
      if (!this.cookie) return;
      this.isLoading.playlists = true;
      try {
        const res = await apiFetch(`/user/playlist?uid=${uid}&cookie=${encodeURIComponent(this.cookie)}`);
        this.playlists = res.playlist;
      } catch (error) {
        console.error("获取用户歌单失败:", error);
      } finally {
        this.isLoading.playlists = false;
      }
    },
    async fetchLikelist(uid: number) {
      if (!this.cookie) return;
      try {
        const res = await apiFetch(`/likelist?uid=${uid}&cookie=${encodeURIComponent(this.cookie)}`);
        if (res.ids) {
          this.likedSongIds = res.ids;
        }
      } catch (error) {
        console.error("获取喜欢音乐列表失败:", error);
      }
    },
    saveSessionToCache() {
      const sessionData = {
        profile: this.profile,
        level: this.level,
        cookie: this.cookie,
        loginTimestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(sessionData));
    },
    tryLoadFromCache() {
      const sessionString = localStorage.getItem(CACHE_KEY);
      if (!sessionString) return;
      try {
        const sessionData = JSON.parse(sessionString);
        if (Date.now() - sessionData.loginTimestamp > CACHE_EXPIRATION) {
          this.logout();
          return;
        }
        this.profile = sessionData.profile;
        this.level = sessionData.level;
        this.cookie = sessionData.cookie;
        if (this.profile) {
          this.getUserPlaylists(this.profile.userId);
          this.fetchLikelist(this.profile.userId);
        }
      } catch (error) {
        this.logout();
      }
    },
    logout() {
      this.profile = null;
      this.level = 0;
      this.cookie = null;
      this.playlists = [];
      this.likedSongIds = [];
      this.qr.img = '';
      this.qr.status = 0;
      localStorage.removeItem(CACHE_KEY);
    }
  }
});
