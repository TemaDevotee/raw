import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: false,
});

api.interceptors.request.use((cfg) => {
  const key = import.meta.env.VITE_ADMIN_KEY || 'dev-admin-key';
  cfg.headers = cfg.headers || {};
  cfg.headers['X-Admin-Key'] = key;
  const token = sessionStorage.getItem('token');
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  return cfg;
});

export default api;
