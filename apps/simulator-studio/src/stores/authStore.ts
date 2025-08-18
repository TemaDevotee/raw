import { defineStore } from 'pinia';
import api from '@/shared/http/api';

export type TenantRole = 'owner' | 'operator' | 'viewer';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as any | null,
    tenants: [] as Array<{ id: string; name: string; role: TenantRole }>,
    currentTenantId: null as string | null,
    isImpersonating: false,
  }),
  getters: {
    authed: (s) => !!s.token,
    currentRole: (s) => s.tenants.find((t) => t.id === s.currentTenantId)?.role,
    isOwner(): boolean {
      return this.currentRole === 'owner';
    },
    isOperator(): boolean {
      return this.currentRole === 'operator';
    },
    isViewer(): boolean {
      return this.currentRole === 'viewer';
    },
  },
  actions: {
    persistToken(token: string | null) {
      const key = import.meta.env.VITE_STUDIO_TOKEN_KEY || 'studio.auth.token';
      if (token) localStorage.setItem(key, token);
      else localStorage.removeItem(key);
    },
    async fetchMe() {
      if (!this.token) return;
      const { data } = await api.get('/auth/me');
      this.user = data.user;
      this.tenants = data.tenants;
      this.currentTenantId = data.currentTenantId;
      this.isImpersonating = data.isImpersonating;
    },
    async login(email: string, password: string) {
      const { data } = await api.post('/auth/login', { email, password });
      this.token = data.token;
      this.persistToken(data.token);
      this.user = data.user;
      this.tenants = data.tenants;
      this.currentTenantId = data.currentTenantId;
    },
    async switchTenant(id: string) {
      if (!this.token) return;
      const { data } = await api.post('/auth/switch-tenant', { tenantId: id });
      this.token = data.token;
      this.persistToken(this.token);
      this.currentTenantId = data.currentTenantId;
      this.tenants = data.tenants;
    },
    async logout() {
      if (this.token) {
        try {
          await api.post('/auth/logout');
        } catch {}
      }
      this.token = null;
      this.user = null;
      this.tenants = [];
      this.currentTenantId = null;
      this.isImpersonating = false;
      this.persistToken(null);
    },
    hydrate() {
      const key = import.meta.env.VITE_STUDIO_TOKEN_KEY || 'studio.auth.token';
      const t = localStorage.getItem(key);
      if (t) {
        this.token = t;
      }
    },
  },
});
