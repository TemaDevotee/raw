import { defineStore } from 'pinia';
import api from '@/shared/http/api';
import { useAuthStore } from './authStore';

export interface Agent { id: string; name: string; avatarUrl?: string }

export const useAgentsStore = defineStore('agents', {
  state: () => ({ items: [] as Agent[], byId: {} as Record<string, Agent>, loaded: false }),
  actions: {
    async fetchAll() {
      if (this.loaded) return;
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.get('/admin/agents', { params });
      this.items = data.items || [];
      this.byId = {};
      this.items.forEach((a) => (this.byId[a.id] = a));
      this.loaded = true;
    },
    getById(id: string) {
      return this.byId[id];
    },
  },
});
