import axios from 'axios';

export const TOKEN_KEY = 'sytec_access_token';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.5.3.138:4000/';

export const resolveApiFileUrl = (path?: string) => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
