// 文件路径: src/main.ts

import { createApp } from 'vue'
import { createPinia } from 'pinia' // 引入createPinia

import App from './App.vue'
import './style.css' // 确保您的全局样式被引入


const app = createApp(App)
const pinia = createPinia() // 创建Pinia实例

app.use(pinia) // 将Pinia实例挂载到应用上

app.mount('#app')
