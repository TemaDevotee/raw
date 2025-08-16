import { defineStore } from 'pinia';
import api from '@studio/adminClient';

type Msg = { id: string; role: 'user'|'agent'; text: string; ts: number };
type Chat = { id: string; title: string; updatedAt: number };

export const useChatsStore = defineStore('chats', {
  state: () => ({
    list: [] as Chat[],
    currentId: null as string|null,
    messages: [] as Msg[],
    loading: false,
    posting: false,
  }),
  actions: {
    async fetchList() {
      this.loading = true;
      try { const { data } = await api.get('/admin/chats'); this.list = data.chats || []; }
      finally { this.loading = false; }
    },
    async create(title: string) {
      const t = title.trim();
      if (!t) return;
      this.posting = true;
      try {
        const { data } = await api.post('/admin/chats', { title: t });
        await this.fetchList();
        if (data?.id) await this.open(data.id);
      } finally { this.posting = false; }
    },
    async open(id: string) {
      this.currentId = id;
      this.loading = true;
      try {
        const { data } = await api.get(`/admin/chats/${id}/transcript`);
        this.messages = data.messages || [];
      } finally {
        this.loading = false;
      }
    },
    append(msg: Msg) {
      if (!this.messages.some(m => m.id === msg.id)) this.messages.push(msg);
    },
    async sendClient(text: string) {
      if (!this.currentId || !text.trim()) return;
      this.posting = true;
      try {
        await api.post(`/admin/chats/${this.currentId}/messages`, { text });
        await this.open(this.currentId); // simple refresh
      } finally { this.posting = false; }
    },
    async sendAgent(text: string) {
      if (!this.currentId || !text.trim()) return;
      this.posting = true;
      try {
        await api.post(`/admin/chats/${this.currentId}/agent`, { text });
        await this.open(this.currentId);
      } finally { this.posting = false; }
    },
  }
});
