// 文件路径: src/services/api.ts

// 使用 Vite 的环境变量来动态设置 API 的基础URL
// 在开发环境中，我们使用代理路径 '/api'。您需要在 vite.config.js 中配置代理。
// 在生产环境中，我们使用部署在Vercel上的公开URL。
const apiBaseUrl = import.meta.env.DEV ? '/api' : 'https://neteasecloudmusicapi-psi-seven.vercel.app';

// 使用一个稳定、公开的IP地址作为realIP参数。
// 这个参数主要用于Vercel部署，以避免因服务器IP变动导致的风控问题。
const realIP = '114.114.114.114';

export const apiFetch = async (endpoint: string) => {
  let finalUrl = `${apiBaseUrl}${endpoint}`;

  // 仅在生产环境（非开发环境）下添加 realIP 参数
  if (!import.meta.env.DEV) {
    // 智能判断是使用 '?' 还是 '&' 来拼接参数
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}realIP=${realIP}`;
  }
  
  const response = await fetch(finalUrl);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};


