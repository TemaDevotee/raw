import { defineStore } from 'pinia';
import api from '@/shared/http/api';
import { showToast } from './toast';

export interface TokenSpendLog {
  id: string;
  ts: number;
  tenantId: string;
  chatId?: string;
  agentId?: string;
  messageId?: string;
  role: string;
  tokens: number;
  note?: string;
}

export const useBillingStore = defineStore('billing', {
  state: () => ({
    plan: { id: 'free', name: 'Free', includedMonthlyTokens: 0 },
    tokenBalance: 0,
    cycleResetAt: 0,
    usageSummary: null as any,
    logs: { items: [] as TokenSpendLog[], nextCursor: null as null | number },
    loading: false,
  }),
  actions: {
    async fetchPlan() {
      const { data } = await api.get('/admin/billing/plan');
      this.plan = data.plan;
      this.tokenBalance = data.tokenBalance;
      this.cycleResetAt = data.cycleResetAt;
    },
    async changePlan(planId: 'free' | 'pro' | 'business') {
      const { data } = await api.post('/admin/billing/plan', { planId });
      this.plan = data.plan;
      showToast('Plan updated / План обновлён');
    },
    async adjustTokens(delta: number, reason?: string) {
      const { data } = await api.post('/admin/billing/adjust-tokens', { delta, reason });
      this.tokenBalance = data.tokenBalance;
      showToast('Balance adjusted / Баланс изменён');
    },
    async fetchUsageSummary(range: { since: number; until: number }) {
      const { data } = await api.get('/admin/billing/usage/summary', { params: range });
      this.usageSummary = data;
    },
    async fetchLogs(opts: { cursor?: number; limit?: number } = {}) {
      const { data } = await api.get('/admin/billing/usage/logs', { params: opts });
      if (opts.cursor) this.logs.items.push(...data.items);
      else this.logs.items = data.items;
      this.logs.nextCursor = data.nextCursor;
    },
  },
});
