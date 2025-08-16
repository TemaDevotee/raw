import { defineStore } from 'pinia';
import { useChatsStore } from './chats';

export const useEventsStore = defineStore('events', {
  state: () => ({
    status: 'idle' as 'idle' | 'connecting' | 'open' | 'polling',
    es: null as EventSource | null,
    pollTimer: null as number | null,
  }),
  actions: {
    connect(tenantId: string) {
      if (this.es) this.es.close();
      const url = `${import.meta.env.VITE_API_BASE}/admin/events/${tenantId}?admin_key=${import.meta.env.VITE_ADMIN_KEY || 'dev-admin-key'}`;
      this.status = 'connecting';
      try {
        const es = new EventSource(url);
        es.onopen = () => {
          this.status = 'open';
          if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
        };
        es.onerror = () => {
          this.status = 'polling';
          es.close();
          this.startPolling(tenantId);
        };
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            const ch = useChatsStore();
            if (data.type === 'message_posted') {
              ch.fetchList();
              if (ch.currentId === data.chatId) ch.append(data.payload);
            } else if (data.type === 'chat_created') {
              ch.fetchList();
            }
          } catch { /* ignore */ }
        };
        this.es = es;
      } catch {
        this.startPolling(tenantId);
      }
    },
    startPolling(tenantId: string) {
      const ch = useChatsStore();
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.pollTimer = window.setInterval(() => {
        ch.fetchList();
        if (ch.currentId) ch.open(ch.currentId);
      }, 2000);
    },
  }
});
