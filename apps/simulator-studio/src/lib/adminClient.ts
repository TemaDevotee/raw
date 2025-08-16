import axios from 'axios'

const apiBase = import.meta.env.VITE_API_BASE || window.location.origin
export const adminClient = axios.create({
  baseURL: apiBase,
  withCredentials: false,
})

adminClient.interceptors.request.use(cfg => {
  const key = localStorage.getItem('studio.adminKey') || import.meta.env.VITE_ADMIN_KEY
  if (key) cfg.headers['X-Admin-Key'] = key
  return cfg
})
