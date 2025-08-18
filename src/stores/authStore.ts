import { defineStore } from 'pinia';
import api from '@/shared/http/api';
import { pinia } from './pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as any | null,
  }),
  getters: {
    authed: (state) => !!state.token,
  },
  actions: {
    hydrate() {
      const t = sessionStorage.getItem('auth:token');
      const u = sessionStorage.getItem('auth:user');
      this.token = t || null;
      this.user = u ? JSON.parse(u) : null;
    },
    setSession(token: string, user: any) {
      this.token = token;
      this.user = user;
      sessionStorage.setItem('auth:token', token);
      sessionStorage.setItem('auth:user', JSON.stringify(user));
    },
    async login(username: string, password: string) {
      const { data } = await api.post('/auth/login', { username, password });
      this.setSession(data.token, data.user);
    },
    logout() {
      this.token = null;
      this.user = null;
      sessionStorage.removeItem('auth:token');
      sessionStorage.removeItem('auth:user');
    },
  },
});

export const authStore = useAuthStore(pinia);
