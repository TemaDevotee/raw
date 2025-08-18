import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

api.interceptors.request.use((cfg) => {
  const token = sessionStorage.getItem('auth:token');
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers['Authorization'] = `Bearer ${token}`;
  }
  return cfg;
});

export default api;
