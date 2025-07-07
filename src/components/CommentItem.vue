<!-- 
  文件路径: src/components/CommentItem.vue
  描述: 独立的评论项组件，支持回复功能。
-->
<template>
    <li class="flex space-x-4">
      <img :src="comment.user.avatarUrl" class="w-10 h-10 rounded-full flex-shrink-0">
      <div class="flex-1">
        <p class="text-sm text-gray-400">{{ comment.user.nickname }}</p>
        <p class="text-white mt-1">{{ comment.content }}</p>
        
        <!-- 楼中楼回复 -->
        <div v-if="comment.beReplied && comment.beReplied.length > 0" class="mt-2 p-3 bg-white/5 rounded-lg">
          <p class="text-sm text-gray-300">
            <a class="font-bold hover:underline">@{{ comment.beReplied[0].user.nickname }}</a>: 
            {{ comment.beReplied[0].content }}
          </p>
        </div>
  
        <div class="flex items-center text-xs text-gray-500 mt-2 space-x-4">
          <span>{{ formatRelativeTime(comment.time) }}</span>
          <button @click="showReplyInput = !showReplyInput" class="hover:text-white">回复</button>
          <button @click="playerStore.likeComment(comment.commentId, !comment.liked)" class="flex items-center space-x-1 hover:text-white">
            <ThumbsUp :fill="comment.liked ? 'currentColor' : 'none'" class="w-4 h-4" :class="{'text-blue-400': comment.liked}" />
            <span>{{ comment.likedCount > 0 ? comment.likedCount : '' }}</span>
          </button>
        </div>
  
        <!-- 回复输入框 -->
        <div v-if="showReplyInput" class="mt-3 flex space-x-2">
          <input 
            v-model="replyContent"
            :placeholder="`回复 @${comment.user.nickname}`"
            class="flex-1 bg-white/5 border-white/10 rounded-full px-4 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button @click="submitReply" class="px-4 py-1 bg-blue-600 rounded-full text-sm hover:bg-blue-700">发送</button>
        </div>
      </div>
    </li>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import type { PropType } from 'vue';
  import type { Comment } from '../types';
  import { usePlayerStore } from '../store/player';
  import { ThumbsUp } from 'lucide-vue-next';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  import 'dayjs/locale/zh-cn';
  
  dayjs.extend(relativeTime);
  dayjs.locale('zh-cn');
  
  const props = defineProps({
    comment: {
      type: Object as PropType<Comment>,
      required: true,
    }
  });
  
  const playerStore = usePlayerStore();
  const showReplyInput = ref(false);
  const replyContent = ref('');
  
  const formatRelativeTime = (timestamp: number) => {
    return dayjs(timestamp).fromNow();
  };
  
  const submitReply = async () => {
    if (!replyContent.value.trim()) return;
    const success = await playerStore.replyToComment(props.comment.commentId, replyContent.value);
    if (success) {
      replyContent.value = '';
      showReplyInput.value = false;
    }
  };
  </script>
  