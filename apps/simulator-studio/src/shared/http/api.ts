import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

api.interceptors.request.use((cfg) => {
  const tokenKey = import.meta.env.VITE_STUDIO_TOKEN_KEY || 'studio.auth.token';
  const token = localStorage.getItem(tokenKey);
  const key = import.meta.env.VITE_ADMIN_KEY || 'dev-admin-key';
  cfg.headers = cfg.headers || {};
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  cfg.headers['X-Admin-Key'] = key;
  return cfg;
});

export default api;
