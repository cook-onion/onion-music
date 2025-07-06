// 文件路径: src/services/api.ts

// 使用 Vite 的内置环境变量来动态设置 API 的基础URL。
const apiBaseUrl = import.meta.env.DEV 
  ? '/api' 
  : 'https://api.cook-onion.fun';

// 使用一个稳定、公开的IP地址作为realIP参数。
const realIP = '114.114.114.114';

export const apiFetch = async (endpoint: string) => {
  // 核心修改：移除环境判断，让所有请求都带上 realIP 参数
  // 这能有效解决本地开发时因IP被限制而导致的连接重置问题。
  const separator = endpoint.includes('?') ? '&' : '?';
  const finalUrl = `${apiBaseUrl}${endpoint}${separator}realIP=${realIP}`;
  
  try {
    const response = await fetch(finalUrl);
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();

  } catch (error) {
    console.error("API Fetch Error:", error);
    throw new Error('网络请求失败，请检查您的网络连接或稍后再试。');
  }
};

/*
 * ----------------------------------------------------------------
 * 提醒：请确保您的 vite.config.js 文件中已配置了开发环境代理
 * ----------------------------------------------------------------
 *
 * export default defineConfig({
 * server: {
 * host: true,
 * proxy: {
 * '/api': {
 * target: 'http://localhost:3000',
 * changeOrigin: true,
 * rewrite: (path) => path.replace(/^\/api/, ''),
 * },
 * },
 * },
 * // ...其他配置
 * });
 *
 */
