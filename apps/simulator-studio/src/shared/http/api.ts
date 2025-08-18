import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('studio.auth.token');
  const key = import.meta.env.VITE_ADMIN_KEY || 'dev_admin_key';
  cfg.headers = cfg.headers || {};
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  cfg.headers['X-Admin-Key'] = key;
  return cfg;
});

export default api;
