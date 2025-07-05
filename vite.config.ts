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
    host: true, // 或者写 '0.0.0.0'
    //设置代理
    proxy: {
      '/api': {
        target: 'https://neteasecloudmusicapi-psi-seven.vercel.app/', // 目标服务器地址
        // target: 'http://localhost:3000', // 目标服务器地址
        changeOrigin: true, // 是否跨域
        rewrite: (path) => path.replace(/^\/api/, '') // 重写路径
      }
    }
  }
})
