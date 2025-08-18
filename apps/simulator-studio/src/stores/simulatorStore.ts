import { defineStore } from 'pinia';
import api from '@/shared/http/api';
import { useAuthStore } from '@/stores/authStore';
import handleSimEvent from '@/utils/handleSimEvent';

export interface SimEvent {
  type: string;
  tenantId?: string;
  payload: any;
  ts?: number;
  options?: { simulateNoCharge?: boolean };
}

export const useSimulatorStore = defineStore('simulator', {
  state: () => ({
    enabled: import.meta.env.VITE_ENABLE_SIMULATOR === 'true',
    wsConnected: false,
    feed: [] as SimEvent[],
    paused: false,
    ws: null as WebSocket | null,
  }),
  actions: {
    connectWS() {
      if (!this.enabled) return;
      const auth = useAuthStore();
      if (!auth.token) return;
      const url = `${location.origin.replace('http', 'ws')}/ws?token=${auth.token}`;
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => { this.wsConnected = true; };
      ws.onclose = () => {
        this.wsConnected = false;
        setTimeout(() => this.connectWS(), 1000);
      };
      ws.onmessage = (e) => {
        const evt: SimEvent = JSON.parse(e.data);
        if (!this.paused) this.feed.unshift(evt);
        handleSimEvent(evt);
      };
    },
    pushToFeed(evt: SimEvent) {
      if (!this.paused) this.feed.unshift(evt);
    },
    async emitEvent(evt: SimEvent) {
      const auth = useAuthStore();
      const params = { tenant: auth.currentTenantId } as any;
      await api.post('/admin/sim/events', evt, { params });
    },
  },
});
