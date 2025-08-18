import { defineStore } from 'pinia';
import api from '@/shared/http/api';
import { useAuthStore } from './authStore';
import { useAgentsStore } from './agents';
import { useBillingStore } from './billingStore';
import { estimateTokens } from '@/utils/tokens';
import { showToast } from '@/stores/toast';

export interface ChatSummary {
  id: string;
  title: string;
  status: string;
  participants: { clientName: string; agentId: string | null };
  presence: { operators: string[] };
  control: { mode: 'agent' | 'operator'; ownerUserId: string | null; since: number };
  lastMessageAt: number;
  workspaceId: string | null;
}

export interface Chat extends ChatSummary {}

export interface Message {
  id: string;
  chatId: string;
  role: 'client' | 'agent' | 'system';
  text: string;
  ts: number;
  cursor: number;
  draft?: boolean;
  approvedAt?: number | null;
  discardedAt?: number | null;
  deliveredAt?: number | null;
}

export const useChatsStore = defineStore('chats', {
  state: () => ({
    list: [] as ChatSummary[],
    byId: {} as Record<string, Chat>,
    transcript: {} as Record<string, { items: Message[]; lastCursor: number | null }>,
    polling: {} as Record<string, { timer: number | null; backoff: number }>,
    filters: { status: [] as string[], q: '' },
  }),
  actions: {
    async fetchChats({ status, q, limit }: { status?: string[]; q?: string; limit?: number } = {}) {
      const auth = useAuthStore();
      const params: any = { tenant: auth.currentTenantId, limit };
      if (status && status.length) params.status = status.join(',');
      if (q) params.q = q;

      const agents = useAgentsStore();
      if (!agents.loaded) await agents.fetchAll();

      const { data } = await api.get('/admin/chats', { params });
      let items: ChatSummary[] = data.items || [];

      if (q) {
        const s = q.toLowerCase();
        items = items.filter((c) => {
          const agentName = c.participants.agentId
            ? agents.getById(c.participants.agentId)?.name?.toLowerCase() || ''
            : '';
          return (
            c.title.toLowerCase().includes(s) ||
            c.participants.clientName.toLowerCase().includes(s) ||
            agentName.includes(s)
          );
        });
      }

      this.list = items;
      this.filters = { status: status || [], q: q || '' };
      return { items };
    },
    async createChat(payload: { title: string; clientName: string; agentId?: string | null; workspaceId?: string | null }) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.post('/admin/chats', payload, { params });
      this.list.unshift(data);
      return data;
    },
    async getChat(id: string) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.get(`/admin/chats/${id}`, { params });
      this.byId[id] = data;
      if (!this.transcript[id]) this.transcript[id] = { items: [], lastCursor: null };
      return data;
    },
    async updateChat(id: string, partial: any) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.patch(`/admin/chats/${id}`, partial, { params });
      this.byId[id] = data;
      const idx = this.list.findIndex((c) => c.id === id);
      if (idx !== -1) this.list[idx] = data;
      return data;
    },
    async sendMessage(chatId: string, { role, text }: { role: 'client' | 'agent' | 'system'; text: string }) {
      const auth = useAuthStore();
      const billing = useBillingStore();
      const chat = this.byId[chatId];
      if (
        (auth.currentRole === 'operator' || auth.currentRole === 'owner') &&
        chat.control.mode === 'operator' &&
        chat.control.ownerUserId !== auth.user?.id
      ) {
        showToast('Chat is controlled by another operator / Чат контролируется другим оператором', 'error');
        throw new Error('controlled');
      }
      if (role === 'agent') {
        if (chat.control.mode === 'operator') {
          showToast('Will be stored as draft (operator control) / Будет сохранено как черновик (контроль оператора)');
        }
        if (billing.tokenBalance <= 0) {
          showToast('Out of tokens / Недостаточно токенов', 'error');
          throw new Error('no_tokens');
        }
      }
      const params = { tenant: auth.currentTenantId };
      try {
        const { data } = await api.post(`/admin/chats/${chatId}/messages`, { role, text }, { params });
        const t = this.transcript[chatId] || { items: [], lastCursor: null };
        if (!t.items.some((m) => m.id === data.id)) t.items.push(data);
        t.lastCursor = data.cursor;
        this.transcript[chatId] = t;
        if (role === 'agent') {
          billing.tokenBalance = Math.max(0, billing.tokenBalance - estimateTokens(text));
        }
        return data;
      } catch (err: any) {
        if (err.response?.status === 402 && err.response.data?.code === 'TOKEN_BALANCE_EXCEEDED') {
          billing.tokenBalance = err.response.data.balance;
          showToast(
            `Out of tokens: need ${err.response.data.needed} / Нет токенов: нужно ${err.response.data.needed}`,
            'error',
            4000,
          );
        } else {
          showToast('Send failed / Не удалось отправить', 'error');
        }
        throw err;
      }
    },
    async interfere(chatId: string) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.post(`/admin/chats/${chatId}/interfere`, {}, { params });
      this.byId[chatId] = data;
      const idx = this.list.findIndex((c) => c.id === chatId);
      if (idx !== -1) this.list[idx] = data;
      return data;
    },
    async returnToAgent(chatId: string) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.post(`/admin/chats/${chatId}/return`, {}, { params });
      this.byId[chatId] = data;
      const idx = this.list.findIndex((c) => c.id === chatId);
      if (idx !== -1) this.list[idx] = data;
      return data;
    },
    async approveDraft(chatId: string, messageId: string) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.post(
        `/admin/chats/${chatId}/messages/${messageId}/approve`,
        {},
        { params },
      );
      const t = this.transcript[chatId];
      if (t) {
        const idx = t.items.findIndex((m) => m.id === messageId);
        if (idx !== -1) t.items[idx] = data;
      }
      return data;
    },
    async discardDraft(chatId: string, messageId: string) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      await api.post(`/admin/chats/${chatId}/messages/${messageId}/discard`, {}, { params });
      const t = this.transcript[chatId];
      if (t) t.items = t.items.filter((m) => m.id !== messageId);
    },
    async joinPresence(chatId: string) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.post(`/admin/chats/${chatId}/presence/join`, {}, { params });
      if (this.byId[chatId]) this.byId[chatId].presence = data;
      return data;
    },
    async leavePresence(chatId: string) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId };
      const { data } = await api.post(`/admin/chats/${chatId}/presence/leave`, {}, { params });
      if (this.byId[chatId]) this.byId[chatId].presence = data;
      return data;
    },
    startPolling(chatId: string) {
      const info = this.polling[chatId] || { timer: null, backoff: 1500 };
      const loop = async () => {
        try {
          await this._pollOnce(chatId);
          info.backoff = 1500;
        } catch {
          info.backoff = Math.min(info.backoff * 2, 10000);
        }
        info.timer = window.setTimeout(loop, info.backoff);
      };
      if (info.timer) clearTimeout(info.timer);
      this.polling[chatId] = info;
      loop();
    },
    stopPolling(chatId: string) {
      const p = this.polling[chatId];
      if (p && p.timer) clearTimeout(p.timer);
      delete this.polling[chatId];
    },
    async _pollOnce(chatId: string) {
      const auth = useAuthStore();
      const t = this.transcript[chatId] || { items: [], lastCursor: null };
      const params: any = { tenant: auth.currentTenantId, limit: 50 };
      if (t.lastCursor != null) params.since = t.lastCursor;
      const { data } = await api.get(`/admin/chats/${chatId}/transcript`, { params });
      data.items.forEach((m: Message) => {
        const idx = t.items.findIndex((x) => x.id === m.id);
        if (idx === -1) t.items.push(m);
        else t.items[idx] = m;
      });
      t.items = t.items.filter((m) => !m.discardedAt);
      t.lastCursor = data.lastCursor;
      t.items.sort((a, b) => a.ts - b.ts);
      this.transcript[chatId] = t;
      return data;
    },
  },
});

