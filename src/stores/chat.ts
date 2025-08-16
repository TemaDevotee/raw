import { defineStore } from 'pinia';
import apiClient from '@/api';

export interface Msg { id: string; role: 'user' | 'agent'; text: string; ts: number }

export const useChatStore = defineStore('chat', {
  state: () => ({
    currentId: null as string | null,
    messages: [] as Msg[],
    lastTs: null as number | null,
    refreshTimer: null as number | null,
    es: null as EventSource | null,
    loading: false,
    posting: false,
  }),
  actions: {
    async open(id: string) {
      this.currentId = id;
      this.loading = true;
      try {
        const { data } = await apiClient.get(`/app/chats/${id}/transcript`);
        this.messages = data.messages || [];
        this.lastTs = data.lastTs ?? (this.messages.length ? Math.max(...this.messages.map(m => m.ts)) : null);
        this.startSse();
      } finally {
        this.loading = false;
      }
    },
    startAutoRefresh() {
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      this.refreshTimer = window.setInterval(() => this.fetchSince(), 1500);
    },
    startSse() {
      if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; }
      if (this.es) this.es.close();
      try {
        const url = `${import.meta.env.VITE_API_BASE}/admin/events/demo?admin_key=${import.meta.env.VITE_ADMIN_KEY || 'dev-admin-key'}`;
        const es = new EventSource(url);
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data.type === 'message_posted' && data.chatId === this.currentId) {
              if (!this.messages.some(m => m.id === data.payload.id)) this.messages.push(data.payload);
            }
          } catch { /* ignore */ }
        };
        es.onerror = () => {
          es.close();
          this.startAutoRefresh();
        };
        this.es = es;
      } catch {
        this.startAutoRefresh();
      }
    },
    async fetchSince() {
      if (!this.currentId || this.lastTs === null) return;
      try {
        const { data } = await apiClient.get(`/app/chats/${this.currentId}/transcript`, { params: { since: this.lastTs } });
        const newMsgs: Msg[] = data.messages || [];
        if (newMsgs.length) {
          const existing = new Set(this.messages.map(m => m.id));
          newMsgs.forEach(m => { if (!existing.has(m.id)) this.messages.push(m); });
        }
        if (data.lastTs !== undefined) this.lastTs = data.lastTs;
      } catch {
        /* silent */
      }
    },
    close() {
      if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; }
      if (this.es) { this.es.close(); this.es = null; }
      this.currentId = null;
      this.lastTs = null;
    },
    async sendUser(text: string) {
      if (!this.currentId || !text.trim()) return;
      this.posting = true;
      try {
        await apiClient.post(`/app/chats/${this.currentId}/messages`, { text });
        await this.fetchSince();
      } finally {
        this.posting = false;
      }
    },
  },
});
