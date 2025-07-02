// 文件路径: src/services/api.ts

const apiBaseUrl = 'http://localhost:3000'; // !!重要!! 修改为您的API地址

export const apiFetch = async (endpoint: string) => {
  const url = `${apiBaseUrl}${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};
