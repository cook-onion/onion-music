import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // ...
  ],
  server: { // 添加这个 server 配置
    host: true // 或者写 '0.0.0.0'
  }
})
