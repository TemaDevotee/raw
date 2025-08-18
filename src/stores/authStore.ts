import { defineStore } from 'pinia';
import api from '@/shared/http/api';
import { pinia } from './pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as any | null,
    tenants: [] as Array<any>,
    currentTenantId: null as string | null,
  }),
  getters: {
    authed: (state) => !!state.token,
  },
  actions: {
    hydrate() {
      const t = sessionStorage.getItem('auth:token');
      const u = sessionStorage.getItem('auth:user');
      const ten = sessionStorage.getItem('auth:tenants');
      const ct = sessionStorage.getItem('auth:currentTenantId');
      this.token = t || null;
      this.user = u ? JSON.parse(u) : null;
      this.tenants = ten ? JSON.parse(ten) : [];
      this.currentTenantId = ct || null;
    },
    setSession(
      token: string,
      user: any,
      tenants: Array<any> = [],
      currentTenantId: string | null = null,
    ) {
      this.token = token;
      // keep legacy consumer compatibility by exposing tenant on user
      this.user = { ...user, tenant: currentTenantId };
      this.tenants = tenants;
      this.currentTenantId = currentTenantId;
      sessionStorage.setItem('auth:token', token);
      sessionStorage.setItem('auth:user', JSON.stringify(this.user));
      sessionStorage.setItem('auth:tenants', JSON.stringify(tenants));
      if (currentTenantId) sessionStorage.setItem('auth:currentTenantId', currentTenantId);
      else sessionStorage.removeItem('auth:currentTenantId');
    },
    async login(email: string, password: string) {
      const { data } = await api.post('/auth/login', { email, password });
      this.setSession(data.token, data.user, data.tenants, data.currentTenantId);
    },
    logout() {
      this.token = null;
      this.user = null;
      this.tenants = [];
      this.currentTenantId = null;
      sessionStorage.removeItem('auth:token');
      sessionStorage.removeItem('auth:user');
      sessionStorage.removeItem('auth:tenants');
      sessionStorage.removeItem('auth:currentTenantId');
    },
  },
});

export const authStore = useAuthStore(pinia);
